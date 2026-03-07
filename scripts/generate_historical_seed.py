from __future__ import annotations

import json
import re
import sys
import unicodedata
import uuid
import xml.etree.ElementTree as ET
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZipFile


WORKBOOK_NAMESPACES = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}
UUID_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "mosiermadness/historical-seed")
DEFAULT_WORKBOOK = Path(r"C:\Users\joshr\Downloads\Stats for Joshua (2024 11 17).xlsx")
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SQL_OUTPUT = REPO_ROOT / "sql" / "historical_seed.sql"
DEFAULT_JSON_OUTPUT = REPO_ROOT / "src" / "lib" / "server" / "history" / "generated-history.json"


@dataclass(frozen=True)
class HistoricalPerson:
    id: str
    slug: str
    display_name: str
    canonical_first_name: str
    canonical_last_name: str


def stable_uuid(value: str) -> str:
    return str(uuid.uuid5(UUID_NAMESPACE, value))


def normalize_text(value: object | None) -> str:
    if value is None:
        return ""

    text = str(value)
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u00a0": " ",
        "\ufffd": "",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)

    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def slugify(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value.lower()).strip("-")
    return slug or "player"


def split_name_parts(display_name: str) -> tuple[str, str]:
    parts = [part for part in display_name.split(" ") if part]
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def sql_literal(value: object | None) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(int(value) if isinstance(value, float) and value.is_integer() else value)
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def load_shared_strings(archive: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    values: list[str] = []
    for item in root.findall("main:si", WORKBOOK_NAMESPACES):
        text = "".join(node.text or "" for node in item.iterfind(".//main:t", WORKBOOK_NAMESPACES))
        values.append(normalize_text(text))
    return values


def load_sheet_targets(archive: ZipFile) -> dict[str, str]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in relationships.findall("rel:Relationship", WORKBOOK_NAMESPACES)
    }

    targets: dict[str, str] = {}
    for sheet in workbook.find("main:sheets", WORKBOOK_NAMESPACES):
        rel_id = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        target = rel_map[rel_id]
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        targets[sheet.attrib["name"]] = target
    return targets


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str | None:
    cell_type = cell.attrib.get("t")
    value = cell.find("main:v", WORKBOOK_NAMESPACES)

    if cell_type == "s" and value is not None and value.text is not None:
        return shared_strings[int(value.text)]

    if cell_type == "inlineStr":
        inline_text = cell.find(".//main:t", WORKBOOK_NAMESPACES)
        return normalize_text(inline_text.text if inline_text is not None else "")

    if value is not None and value.text is not None:
        return normalize_text(value.text)

    return None


def parse_sheet_rows(workbook_path: Path, sheet_name: str) -> list[dict[str, str]]:
    with ZipFile(workbook_path) as archive:
        shared_strings = load_shared_strings(archive)
        sheet_targets = load_sheet_targets(archive)
        root = ET.fromstring(archive.read(sheet_targets[sheet_name]))

    rows: list[dict[str, str]] = []
    headers: dict[str, str] = {}
    sheet_data = root.find("main:sheetData", WORKBOOK_NAMESPACES)
    if sheet_data is None:
        return rows

    for row in sheet_data.findall("main:row", WORKBOOK_NAMESPACES):
        row_values: dict[str, str] = {}
        for cell in row.findall("main:c", WORKBOOK_NAMESPACES):
            reference = cell.attrib.get("r", "")
            column = "".join(character for character in reference if character.isalpha())
            value = cell_value(cell, shared_strings)
            if column and value not in (None, ""):
                row_values[column] = value

        if not row_values:
            continue

        if not headers:
            headers = row_values
            continue

        mapped_row = {
            headers[column]: value
            for column, value in row_values.items()
            if column in headers
        }
        if mapped_row:
            rows.append(mapped_row)

    return rows


def build_people_and_results(raw_rows: list[dict[str, str]]) -> tuple[list[dict[str, object]], list[dict[str, object]], list[dict[str, object]]]:
    people_by_name: dict[str, HistoricalPerson] = {}
    aliases_seen: set[tuple[str, str]] = set()
    person_aliases: list[dict[str, object]] = []
    season_results: list[dict[str, object]] = []

    slug_counts: dict[str, int] = defaultdict(int)

    def get_person(display_name: str) -> HistoricalPerson:
        canonical_name = normalize_text(display_name)
        if canonical_name in people_by_name:
            return people_by_name[canonical_name]

        first_name, last_name = split_name_parts(canonical_name)
        base_slug = slugify(canonical_name)
        slug_counts[base_slug] += 1
        slug = base_slug if slug_counts[base_slug] == 1 else f"{base_slug}-{slug_counts[base_slug]}"
        person = HistoricalPerson(
            id=stable_uuid(f"person:{canonical_name}"),
            slug=slug,
            display_name=canonical_name,
            canonical_first_name=first_name,
            canonical_last_name=last_name,
        )
        people_by_name[canonical_name] = person
        return person

    for row in raw_rows:
        standard_name = normalize_text(row.get("Standard Name"))
        display_name = normalize_text(row.get("Name"))
        person = get_person(standard_name or display_name)

        for alias_name, source in (
            (display_name, "spreadsheet_raw_name"),
            (standard_name or display_name, "spreadsheet_standard_name"),
        ):
            if not alias_name:
                continue

            normalized_alias = normalize_text(alias_name).lower()
            key = (person.id, normalized_alias)
            if key in aliases_seen:
                continue

            aliases_seen.add(key)
            person_aliases.append(
                {
                    "id": stable_uuid(f"alias:{person.id}:{normalized_alias}:{source}"),
                    "person_id": person.id,
                    "alias_name": normalize_text(alias_name),
                    "normalized_alias": normalized_alias,
                    "source": source,
                }
            )

        year = int(row["Year"])
        final_rank = int(row["Rank"])
        round1_points = int(row.get("Round1", "0") or 0)
        round2_points = int(row.get("Round2", "0") or 0)
        round3_points = int(row.get("Round3", "0") or 0)
        round4_points = int(row.get("Round4", "0") or 0)
        round5_points = int(row.get("Round5", "0") or 0)
        round6_points = int(row.get("Round6", "0") or 0)
        total_points = int(row.get("Total", "0") or 0)
        correct_games = int(row.get("Games", "0") or 0)

        season_results.append(
            {
                "id": stable_uuid(f"season-result:{year}:{person.id}"),
                "year": year,
                "person_id": person.id,
                "final_rank": final_rank,
                "total_points": total_points,
                "correct_games": correct_games,
                "round1_points": round1_points,
                "round2_points": round2_points,
                "round3_points": round3_points,
                "round4_points": round4_points,
                "round5_points": round5_points,
                "round6_points": round6_points,
                "source_display_name": display_name,
                "source_standard_name": standard_name or display_name,
            }
        )

    people = [
        {
            "id": person.id,
            "slug": person.slug,
            "display_name": person.display_name,
            "canonical_first_name": person.canonical_first_name,
            "canonical_last_name": person.canonical_last_name,
            "linked_profile_id": None,
            "bio": None,
            "is_family": False,
            "is_active_recently": False,
        }
        for person in sorted(people_by_name.values(), key=lambda person: person.display_name)
    ]

    person_aliases.sort(key=lambda alias: (alias["alias_name"], alias["person_id"]))
    season_results.sort(key=lambda result: (result["year"], result["final_rank"], result["person_id"]))
    return people, person_aliases, season_results


def build_seasons(season_results: list[dict[str, object]], people_by_id: dict[str, dict[str, object]]) -> list[dict[str, object]]:
    results_by_year: dict[int, list[dict[str, object]]] = defaultdict(list)
    for result in season_results:
        results_by_year[int(result["year"])].append(result)

    historical_seasons: list[dict[str, object]] = [
        {
            "year": 2008,
            "status": "completed",
            "label": "Mosier Madness 2008",
            "notes": "Champion tracked manually; full entrant-level results were not included in the source workbook.",
            "winner_person_id": stable_uuid("person:Joshua Mosier"),
            "winning_score": None,
            "field_size": None,
            "source": "manual",
        },
        {
            "year": 2020,
            "status": "cancelled",
            "label": "Mosier Madness 2020",
            "notes": "Tournament canceled due to the COVID-19 pandemic.",
            "winner_person_id": None,
            "winning_score": None,
            "field_size": None,
            "source": "manual",
        },
    ]

    for year, yearly_results in sorted(results_by_year.items()):
        winner = min(yearly_results, key=lambda result: result["final_rank"])
        historical_seasons.append(
            {
                "year": year,
                "status": "completed",
                "label": f"Mosier Madness {year}",
                "notes": None,
                "winner_person_id": winner["person_id"],
                "winning_score": winner["total_points"],
                "field_size": len(yearly_results),
                "source": "spreadsheet",
            }
        )

    historical_seasons.sort(key=lambda season: season["year"])

    for season in historical_seasons:
        winner_id = season.get("winner_person_id")
        if winner_id and winner_id not in people_by_id:
            raise ValueError(f"Missing person row for winner id {winner_id}")

    return historical_seasons


def build_payload(workbook_path: Path) -> dict[str, object]:
    raw_rows = parse_sheet_rows(workbook_path, "Raw Data")
    people, person_aliases, season_results = build_people_and_results(raw_rows)
    people_by_id = {person["id"]: person for person in people}
    historical_seasons = build_seasons(season_results, people_by_id)

    return {
        "meta": {
            "sourceWorkbook": str(workbook_path),
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "seasonCount": len(historical_seasons),
            "personCount": len(people),
            "resultCount": len(season_results),
        },
        "people": people,
        "personAliases": person_aliases,
        "historicalSeasons": historical_seasons,
        "seasonResults": season_results,
    }


def write_json_output(payload: dict[str, object], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_sql_output(payload: dict[str, object], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = [
        "-- Generated by scripts/generate_historical_seed.py",
        f"-- Source workbook: {payload['meta']['sourceWorkbook']}",
        "",
        "begin;",
        "",
    ]

    for person in payload["people"]:
        lines.extend(
            [
                "insert into people (id, slug, display_name, canonical_first_name, canonical_last_name, linked_profile_id, bio, is_family, is_active_recently)",
                "values (",
                f"  {sql_literal(person['id'])},",
                f"  {sql_literal(person['slug'])},",
                f"  {sql_literal(person['display_name'])},",
                f"  {sql_literal(person['canonical_first_name'])},",
                f"  {sql_literal(person['canonical_last_name'])},",
                "  null,",
                "  null,",
                f"  {sql_literal(person['is_family'])},",
                f"  {sql_literal(person['is_active_recently'])}",
                ")",
                "on conflict (id) do update set",
                "  slug = excluded.slug,",
                "  display_name = excluded.display_name,",
                "  canonical_first_name = excluded.canonical_first_name,",
                "  canonical_last_name = excluded.canonical_last_name,",
                "  is_family = excluded.is_family,",
                "  is_active_recently = excluded.is_active_recently;",
                "",
            ]
        )

    lines.extend(
        [
            "-- Link active accounts where canonical names match exactly.",
            "update people",
            "set linked_profile_id = profiles.id",
            "from profiles",
            "where people.linked_profile_id is null",
            "  and lower(coalesce(people.canonical_first_name, '')) = lower(coalesce(profiles.first_name, ''))",
            "  and lower(coalesce(people.canonical_last_name, '')) = lower(coalesce(profiles.last_name, ''));",
            "",
        ]
    )

    for alias in payload["personAliases"]:
        lines.extend(
            [
                "insert into person_aliases (id, person_id, alias_name, normalized_alias, source)",
                "values (",
                f"  {sql_literal(alias['id'])},",
                f"  {sql_literal(alias['person_id'])},",
                f"  {sql_literal(alias['alias_name'])},",
                f"  {sql_literal(alias['normalized_alias'])},",
                f"  {sql_literal(alias['source'])}",
                ")",
                "on conflict (id) do update set",
                "  alias_name = excluded.alias_name,",
                "  normalized_alias = excluded.normalized_alias,",
                "  source = excluded.source;",
                "",
            ]
        )

    for season in payload["historicalSeasons"]:
        lines.extend(
            [
                "insert into historical_seasons (year, status, label, notes, winner_person_id, winning_score, field_size, source)",
                "values (",
                f"  {sql_literal(season['year'])},",
                f"  {sql_literal(season['status'])},",
                f"  {sql_literal(season['label'])},",
                f"  {sql_literal(season['notes'])},",
                f"  {sql_literal(season['winner_person_id'])},",
                f"  {sql_literal(season['winning_score'])},",
                f"  {sql_literal(season['field_size'])},",
                f"  {sql_literal(season['source'])}",
                ")",
                "on conflict (year) do update set",
                "  status = excluded.status,",
                "  label = excluded.label,",
                "  notes = excluded.notes,",
                "  winner_person_id = excluded.winner_person_id,",
                "  winning_score = excluded.winning_score,",
                "  field_size = excluded.field_size,",
                "  source = excluded.source;",
                "",
            ]
        )

    for result in payload["seasonResults"]:
        lines.extend(
            [
                "insert into season_results (id, year, person_id, final_rank, total_points, correct_games, round1_points, round2_points, round3_points, round4_points, round5_points, round6_points, source_display_name, source_standard_name)",
                "values (",
                f"  {sql_literal(result['id'])},",
                f"  {sql_literal(result['year'])},",
                f"  {sql_literal(result['person_id'])},",
                f"  {sql_literal(result['final_rank'])},",
                f"  {sql_literal(result['total_points'])},",
                f"  {sql_literal(result['correct_games'])},",
                f"  {sql_literal(result['round1_points'])},",
                f"  {sql_literal(result['round2_points'])},",
                f"  {sql_literal(result['round3_points'])},",
                f"  {sql_literal(result['round4_points'])},",
                f"  {sql_literal(result['round5_points'])},",
                f"  {sql_literal(result['round6_points'])},",
                f"  {sql_literal(result['source_display_name'])},",
                f"  {sql_literal(result['source_standard_name'])}",
                ")",
                "on conflict (id) do update set",
                "  final_rank = excluded.final_rank,",
                "  total_points = excluded.total_points,",
                "  correct_games = excluded.correct_games,",
                "  round1_points = excluded.round1_points,",
                "  round2_points = excluded.round2_points,",
                "  round3_points = excluded.round3_points,",
                "  round4_points = excluded.round4_points,",
                "  round5_points = excluded.round5_points,",
                "  round6_points = excluded.round6_points,",
                "  source_display_name = excluded.source_display_name,",
                "  source_standard_name = excluded.source_standard_name;",
                "",
            ]
        )

    lines.extend(["commit;", ""])
    output_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    workbook_path = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_WORKBOOK
    workbook_path = workbook_path.resolve()
    if not workbook_path.exists():
        print(f"Workbook not found: {workbook_path}", file=sys.stderr)
        return 1

    payload = build_payload(workbook_path)
    write_json_output(payload, DEFAULT_JSON_OUTPUT)
    write_sql_output(payload, DEFAULT_SQL_OUTPUT)

    print(
        f"Generated {payload['meta']['personCount']} people, "
        f"{payload['meta']['seasonCount']} seasons, "
        f"and {payload['meta']['resultCount']} season results."
    )
    print(f"JSON output: {DEFAULT_JSON_OUTPUT}")
    print(f"SQL output: {DEFAULT_SQL_OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
