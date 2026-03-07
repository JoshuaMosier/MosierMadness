-- Team colors table and seed data
-- Generated from the merged team color data (source JSON + aliases + manual overrides)
-- Total entries: 395

create table team_colors (
  seo_name text primary key,
  primary_color text not null,
  secondary_color text not null,
  tertiary_color text
);

alter table team_colors enable row level security;

create policy "Team colors are viewable by everyone"
  on team_colors for select
  using (true);

create policy "Admins can insert team colors"
  on team_colors for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can update team colors"
  on team_colors for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can delete team colors"
  on team_colors for delete
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- Seed data
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('abilene-christian', '#4f2170', '#ffffff', '#c5c6c8') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('air-force', '#003087', '#8A8D8F', '#003087') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('akron', '#041E42', '#A89968', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('alabama', '#9e1b32', '#828a8f', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('alabama-am', '#5F1316', '#FFFFFF', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('alabama-st', '#C99700', '#000000', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('albany-ny', '#461660', '#eeb211', '#461660') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('alcorn', '#ce8e00', '#4b306a', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('am-corpus-chris', '#1478C7', '#008350', '#07294A') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('american', '#003366', '#003366', '#003366') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('app-state', '#222222', '#ffcc00', '#222222') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('appalachian-st', '#222222', '#ffcc00', '#222222') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('arizona', '#CC0033', '#003366', '#CC0033') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('arizona-st', '#8C1D40', '#FFC627', '#8C1D40') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ark-pine-bluff', '#EEB310', '#E31837', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('arkansas', '#9D2235', '#FFFFFF', '#9D2235') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('arkansas-st', '#cc092f', '#000000', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('army', '#1A191A', '#D4B67B', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('auburn', '#0C2340', '#E87722', '#0C2340') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('austin-peay', '#C41E3A', '#ffffff', '#ADAFAA') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('b-c-wildcats', '#F2A900', '#6F263D', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('bakersfield', '#003594', '#FFC72C', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ball-st', '#BA0C2F', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('baylor', '#154734', '#FFB81C', '#154734') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('bellarmine', '#752936', '#C8C8C8', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('belmont', '#C8102E', '#00205B', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('bethune-cookman', '#6F263D', '#F2A900', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('binghamton', '#005A43', '#169B62', '#BF0D3E') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('boise-st', '#D64309', '#0033A0', '#D64309') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('boston-college', '#98002E', '#BC9B6A', '#726158') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('boston-u', '#CC0000', '#A3011B', '#231F20') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('bowling-green', '#FE5000', '#4F2C1D', '#CDA077') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('bradley', '#A50000', '#999999', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('brown', '#4E3629', '#7C2529', '#E4002B') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('bryant', '#b4975b', '#c9bb8c', '#818286') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('bucknell', '#E87722', '#003865', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('buffalo', '#005BBB', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('butler', '#13294b', '#747678', '#d1e0d7') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('byu', '#0062B8', '#FFFFFF', '#002E5D') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('c-c', '#00539b', '#ffffff', '#cfd4d8') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('cal-poly', '#003831', '#FFE395', '#B38F4F') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('cal-st-fullerton', '#00274C', '#DC8218', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('cal-st-northridge', '#CE1126', '#D1CEC6', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('california', '#003262', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('california-baptist', '#002554', '#A37400', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('campbell', '#f58025', '#231f20', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('canisius', '#0C2340', '#ffba00', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('central-ark', '#4f2d7f', '#818a8f', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('central-conn-st', '#00539B', '#FFFFFF', '#CFD4D8') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('central-mich', '#6A0032', '#FFC82E', '#6A0032') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('charleston-so', '#A8996E', '#002855', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('charlotte', '#046A38', '#B9975B', '#27251F') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('chattanooga', '#00386b', '#e0aa0f', '#adafaa') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('chicago-st', '#006666', '#000000', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('cincinnati', '#E00122', '#E00122', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('citadel', '#3975B7', '#1F3A60', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('clemson', '#F56600', '#522D80', '#F56600') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('cleveland-st', '#006747', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('coastal-caro', '#006f71', '#A27752', '#111111') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('coastal-carolina', '#006f71', '#A27752', '#111111') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('col-of-charleston', '#800000', '#9d8958', '#d9d9d6') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('colgate', '#821019', '#E10028', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('colorado', '#CFB87C', '#000000', '#A2A4A3') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('colorado-st', '#1E4D2B', '#C8C372', '#1E4D2B') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('columbia', '#003865', '#9BCBEB', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('coppin-st', '#003056', '#ffc915', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('cornell', '#B31B1B', '#5e3920', '#89572e') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('creighton', '#005ca9', '#00235D', '#6CADDE') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('csu-bakersfield', '#003594', '#FFC72C', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('dartmouth', '#046A38', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('davidson', '#ac1a2f', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('dayton', '#CE1141', '#004B8D', '#F80228') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('delaware', '#00539f', '#FFDD31', '#ffd200') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('delaware-st', '#EE3124', '#72CDF4', '#009DDC') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('denver', '#8b2332', '#8b6f4b', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('depaul', '#005EB8', '#E4002B', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('detroit', '#AD0C3C', '#19336E', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('drake', '#004477', '#999999', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('drexel', '#00437b', '#ffda02', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('duke', '#003087', '#ffffff', '#012169') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('duquesne', '#041E42', '#BA0C2F', '#041E42') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('east-carolina', '#592A8A', '#FDC82F', '#592A8A') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('east-tenn-st', '#041e42', '#FFC72C', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('eastern-ill', '#919295', '#004b83', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('eastern-ky', '#8a0039', '#ffffff', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('eastern-mich', '#006633', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('eastern-wash', '#A10022', '#000000', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('elon', '#73000a', '#b59a57', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('etsu', '#041e42', '#FFC72C', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('evansville', '#52237f', '#f36f21', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('fairfield', '#C8102E', '#A2AAAD', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('fairleigh-dickinson', '#28334A', '#72293C', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('fdu', '#28334A', '#72293C', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('fgcu', '#002D72', '#007749', '#B9975B') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('fiu', '#081E3F', '#B6862C', '#081E3F') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('fla-atlantic', '#003366', '#CC0000', '#8A8D8F') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('florida', '#0021A5', '#FA4616', '#0021A5') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('florida-am', '#E7881C', '#2E9E62', '#211D1D') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('florida-st', '#782F40', '#CEB888', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('fordham', '#860038', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('fresno-st', '#db0032', '#002e6d', '#007934') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('furman', '#201547', '#582c83', '#A7A8AA') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ga-southern', '#011e41', '#A3AAAE', '#87714D') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('gardner-webb', '#BF2F37', '#ffffff', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('george-mason', '#006633', '#FFCC33', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('george-washington', '#e2cb92', '#002654', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('georgetown', '#041E42', '#8D817B', '#041E42') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('georgia', '#BA0C2F', '#000000', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('georgia-st', '#0039A6', '#C60C30', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('georgia-tech', '#B3A369', '#A28D5B', '#003057') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('gonzaga', '#041E42', '#C8102E', '#C1C6C8') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('grambling', '#eaa921', '#000000', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('grand-canyon', '#522398', '#000000', '#522398') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('green-bay', '#006747', '#9D2235', '#8A8D8F') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('hampton', '#0060A9', '#ffffff', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('hartford', '#c02427', '#0f0708', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('harvard', '#A51C30', '#000000', '#B6B6B6') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('hawaii', '#024731', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('high-point', '#330072', '#ffffff', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('hofstra', '#0B1E73', '#FEB612', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('holy-cross', '#602d89', '#FFFFFF', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('houston', '#C8102E', '#76232F', '#B2B4B2') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('houston-christian', '#1c4e9d', '#f3652c', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('howard', '#003a63', '#e51937', '#6a808c') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('idaho', '#000000', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('idaho-st', '#F37820', '#231F20', '#FEFEFE') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ill-chicago', '#ac1e2d', '#041E42', '#facc09') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('illinois', '#13294b', '#E84A27', '#13294B') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('illinois-st', '#ce1126', '#F9DD16', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('indiana', '#990000', '#EEEDEB', '#990000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('indiana-st', '#0142BC', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('iona', '#6F2C3F', '#F2A900', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('iowa', '#FFCD00', '#000000', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('iowa-st', '#C8102E', '#F1BE48', '#C8102E') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ipfw', '#231F20', '#DAAC27', '#1F3D7C') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('iu-indy', '#D52136', '#001522', '#CA7916') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('iupui', '#9D2235', '#DFD1A7', '#9D2235') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('jackson-st', '#002147', '#008ED6', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('jacksonville', '#004E44', '#898a8d', '#BBBBBB') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('jacksonville-st', '#CC0000', '#ffffff', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('james-madison', '#450084', '#CBB677', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('kansas', '#0051BA', '#E8000D', '#ffc82d') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('kansas-city', '#0047AB', '#FFD700', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('kansas-st', '#512888', '#d1d1d1', '#a7a7a7') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('kennesaw-st', '#FDBB30', '#0B1315', '#C5C6C8') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('kent-st', '#002664', '#EAAB00', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('kentucky', '#0033a0', '#FFFFFF', '#0033A0') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('la-lafayette', '#D11C2E', '#181210', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('la-monroe', '#8A2432', '#EBA900', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('la-salle', '#ffcc00', '#003366', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('lafayette', '#a8996e', '#98002e', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('lamar', '#dc0032', '#ffffff', '#fcb034') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('le-moyne', '#00452A', '#FCE300', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('lehigh', '#653600', '#ffd24f', '#e51937') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('liberty', '#002d62', '#c41230', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('lindenwood-mo', '#101820', '#B5A36A', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('lipscomb', '#331E54', '#F4AA00', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('liu', '#69B3E7', '#FFC72C', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('long-beach-st', '#ffc72a', '#000000', '#FFC72A') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('long-island', '#69B3E7', '#FFC72C', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('longwood', '#15213B', '#999D9E', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('louisiana-tech', '#002F8B', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('louisville', '#AD0000', '#000000', '#FDB913') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('loyola-chicago', '#511D20', '#FDDD4E', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('loyola-maryland', '#00694e', '#cacac8', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('loyola-marymount', '#b62b3a', '#00447c', '#617080') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('lsu', '#461D7C', '#FDD023', '#461D7C') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('maine', '#003263', '#B0D7FF', '#AB0634') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('manhattan', '#00703C', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('marist', '#C8102E', '#b2b2b2', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('marquette', '#003366', '#ffcc00', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('marshall', '#00B140', '#A2AAAD', '#693F23') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('maryland', '#E03a3e', '#ffd520', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('massachusetts', '#971B2F', '#572932', '#B1B3B3') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('mcneese', '#00529b', '#ffd204', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('md-east-shore', '#651D32', '#888B8D', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('memphis', '#003087', '#898D8D', '#F8992E') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('mercer', '#f76800', '#000000', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('mercyhurst', '#1A554B', '#1C294D', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('merrimack', '#003768', '#fdb813', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('miami-fl', '#F47321', '#005030', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('miami-oh', '#b61e2e', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('michigan', '#00274c', '#ffcb05', '#00274C') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('michigan-st', '#18453B', '#FFFFFF', '#18453B') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('middle-tenn', '#0066CC', '#000000', '#69B3E7') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('milwaukee', '#FFBD00', '#CCCCCC', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('minnesota', '#7A0019', '#FFCC33', '#7A0019') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('mississippi', '#00703c', '#e51937', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('mississippi-st', '#660000', '#ffffff', '#CCCCCC') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('mississippi-val', '#00703C', '#E51937', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('missouri', '#000000', '#F1B82D', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('missouri-st', '#5E0009', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('monmouth', '#041E42', '#53565A', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('montana', '#660033', '#999999', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('montana-st', '#00205B', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('morehead-st', '#FFCF00', '#005EB8', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('morgan-st', '#1b4383', '#f47937', '#CDA177') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('mount-st-mary-s', '#002855', '#84754E', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('mt-st-marys', '#002855', '#84754E', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('murray-st', '#ECAC00', '#002144', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('n-s-demons', '#663399', '#ffffff', '#ff6600') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('navy', '#C5B783', '#00205B', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('nc-at', '#154280', '#FAB217', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('nc-central', '#960A2C', '#231F20', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('nc-state', '#CC0000', '#000000', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('neb-omaha', '#000000', '#D71920', '#636568') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('nebraska', '#e41c38', '#000000', '#fdf2d9') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('nevada', '#003366', '#807f84', '#003366') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('new-hampshire', '#041e42', '#BBBCBC', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('new-haven', '#002D74', '#FFC629', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('new-mexico', '#BA0C2F', '#a7a8aa', '#63666A') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('new-mexico-st', '#861F41', '#97999B', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('new-orleans', '#005ca6', '#a3a9ac', '#002f56') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('niagara', '#582C83', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('nicholls-st', '#ae132a', '#72808a', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('njit', '#D22630', '#071D49', '#C1C6C8') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('norfolk-st', '#007A53', '#F3D03E', '#54585A') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('north-ala', '#46166B', '#DB9F11', '#5F6062') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('north-carolina', '#7BAFD4', '#FFFFFF', '#13294B') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('north-carolina-st', '#CC0000', '#000000', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('north-dakota', '#009A44', '#AAAEAD', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('north-dakota-st', '#0a5640', '#ffc72a', '#0A5640') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('north-florida', '#00246B', '#D9D9D9', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('north-texas', '#00853E', '#00853E', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('northeastern', '#D41B2C', '#000000', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('northern-ariz', '#173A79', '#FCD006', '#F2AC20') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('northern-colo', '#013C65', '#F6B000', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('northern-ill', '#BA0C2F', '#8A8D8F', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('northern-ky', '#FFC72C', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('northwestern', '#4E2A84', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('northwestern-st', '#492F92', '#F78426', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('notre-dame', '#0C2340', '#c99700', '#Ae9142') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('oakland', '#B59A57', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ohio', '#00694E', '#CDA077', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ohio-st', '#BB0000', '#666666', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('oklahoma', '#841617', '#FDF9D8', '#841617') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('oklahoma-st', '#FF7300', '#000000', '#FF7300') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('old-dominion', '#003057', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ole-miss', '#CE1126', '#14213D', '#CE1126') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('omaha', '#000000', '#D71920', '#636568') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('oral-roberts', '#002f60', '#C5b783', '#A28E2A') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('oregon', '#154733', '#FEE123', '#154733') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('oregon-st', '#dc4405', '#000000', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('pacific', '#E35205', '#231f20', '#D86018') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('penn', '#011F5B', '#990000', '#990000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('penn-st', '#041E42', '#FFFFFF', '#041E42') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('pepperdine', '#00205c', '#ee7624', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('pittsburgh', '#003594', '#FFB81C', '#1c2957') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('portland', '#1e1656', '#5e6A71', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('portland-st', '#154734', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('prairie-view', '#330066', '#ffcc33', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('presbyterian', '#0060A9', '#9D2235', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('princeton', '#FF671F', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('providence', '#8a8d8f', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('purdue', '#ceb888', '#000000', '#9d968D') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('queens-nc', '#192C66', '#857040', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('quinnipiac', '#0C2340', '#FFB81C', '#418FDE') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('radford', '#c2011b', '#d1d3d4', '#003C71') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('rhode-island', '#68abe8', '#002147', '#68ABE8') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('rice', '#00205B', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('richmond', '#000066', '#990000', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('rider', '#981E32', '#6C6F70', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('robert-morris', '#14234b', '#a6192e', '#b2b1ae') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('rutgers', '#cc0033', '#5F6A72', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('s-h-s-bearkats', '#fe5100', '#ffffff', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('sacramento-st', '#024D36', '#B09247', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('sacred-heart', '#ce1141', '#b1b3b6', '#4d4d4f') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('saint-josephs', '#9e1b32', '#6c6f70', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('saint-louis', '#003DA5', '#C8C9C7', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('sam-houston', '#fe5100', '#ffffff', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('sam-houston-st', '#fe5100', '#ffffff', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('samford', '#002649', '#C4161D', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('san-diego', '#002868', '#84bce8', '#207bc1') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('san-diego-st', '#a6192e', '#000000', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('san-francisco', '#FDBB30', '#00543C', '#919194') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('san-jose-st', '#0055A2', '#E5A823', '#939597') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('santa-clara', '#862633', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('se-m-s-redhawks', '#000000', '#C8102E', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('seattle', '#181717', '#C32F41', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('seton-hall', '#004488', '#A2AAAD', '#004488') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('sfa', '#613393', '#ffffff', '#613393') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('siena', '#FFC72C', '#C8102E', '#006747') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('siu-edwardsville', '#CE202F', '#D4AE7D', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('smu', '#0033A0', '#C8102E', '#0033A0') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('south-ala', '#173A79', '#D2103E', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('south-carolina', '#73000A', '#000000', '#73000A') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('south-carolina-st', '#862633', '#001A72', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('south-dakota', '#ad0000', '#b4b4b4', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('south-dakota-st', '#0033A0', '#FFD100', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('south-fla', '#006747', '#CFC493', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('southeast-mo-st', '#C8102E', '#000000', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('southeastern-la', '#1D4C30', '#F6C03C', '#FFFFFE') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('southern-california', '#990000', '#FFC72C', '#990000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('southern-ill', '#720000', '#FFFFFF', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('southern-ind', '#CF102D', '#002856', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('southern-miss', '#000000', '#FFAB00', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('southern-u', '#58b6e7', '#ffce34', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('southern-utah', '#CF2127', '#231F20', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('st-bonaventure', '#54261a', '#fdb726', '#bdb6b0') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('st-francis-pa', '#BC1F26', '#221F1F', '#A6A8AA') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('st-francis-terriers', '#005496', '#e03a3e', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('st-johns-ny', '#D41041', '#231F20', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('st-marys-ca', '#D80024', '#06315B', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('st-peters', '#21375C', '#FFFFFE', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('st-thomas-mn', '#412784', '#FFFFFF', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('stanford', '#8C1515', '#4D4F53', '#2e2d29') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('stephen-f-austin', '#613393', '#FFFFFF', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('stetson', '#00523E', '#3B8729', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('stonehill', '#2F2975', '#B9B7B8', '#231F20') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('stony-brook', '#990000', '#16243e', '#828282') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('stthom', '#412784', '#FFFFFF', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('syracuse', '#F76900', '#FFFFFF', '#000E54') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('tarleton-st', '#4F2D7F', '#FFFFFF', '#00B1E1') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('tcu', '#4d1979', '#a3a9ac', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('temple', '#9D2235', '#FFCD00', '#8A8D8F') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('tennessee', '#ff8200', '#ffffff', '#58595b') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('tennessee-st', '#00539F', '#ffffff', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('tennessee-tech', '#4F2984', '#FFDD00', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('tex-am', '#500000', '#FFFFFF', '#500000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('tex-am-commerce', '#00386C', '#FFC333', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('texas', '#bf5700', '#333f48', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('texas-a-m', '#500000', '#FFFFFF', '#500000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('texas-am', '#500000', '#FFFFFF', '#500000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('texas-arlington', '#f58025', '#0064b1', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('texas-southern', '#7c183e', '#9da6ab', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('texas-st', '#501214', '#8d734a', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('texas-tech', '#CC0000', '#000000', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('the-citadel', '#3975B7', '#1F3A60', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('toledo', '#15397F', '#005CB9', '#FFDA00') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('towson', '#FFBB00', '#3C3C3C', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('troy', '#8a2432', '#b3b5b8', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('tulane', '#006747', '#43B02A', '#418FDE') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('tulsa', '#002D72', '#C8102E', '#C5B783') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uab', '#CC8A00', '#000000', '#BF0D3E') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ualr', '#6B1F36', '#FFFFFF', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uc-davis', '#002855', '#B3A369', '#002855') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uc-irvine', '#0C2340', '#FFC72C', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uc-riverside', '#2D6CC0', '#003066', '#F1AB00') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uc-san-diego', '#182B49', '#FFCD00', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uc-santa-barbara', '#003660', '#FEBC11', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ucf', '#ffc904', '#ba9b37', '#FFC904') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ucla', '#f2a900', '#FFE800', '#2D68C4') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uconn', '#000e2f', '#ffffff', '#7C878E') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uic', '#ac1e2d', '#041E42', '#facc09') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uiw', '#D12636', '#231F20', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('umass-lowell', '#003DA5', '#C8102E', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('umbc', '#b18906', '#ffc20e', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('umes', '#862633', '#888B8D', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('umkc', '#005293', '#fecb00', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('unc-asheville', '#003DA5', '#ffffff', '#808285') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('unc-greensboro', '#0f2044', '#ffb71b', '#bec0c2') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('unc-seahawks', '#003366', '#006666', '#FFD600') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('unc-wilmington', '#003366', '#006666', '#FFD600') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('uni', '#4B116F', '#FFCC00', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('unlv', '#CF0A2C', '#CAC8C8', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('usc-upstate', '#00703c', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ut-arlington', '#f58025', '#0064b1', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('ut-martin', '#f79728', '#002a5b', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('utah', '#CC0000', '#808080', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('utah-st', '#00263A', '#8a8d8f', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('utah-tech', '#BA1C21', '#003058', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('utah-valley', '#275d38', '#000000', '#8e8c89') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('utep', '#041E42', '#B1B3B3', '#FF8200') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('utrgv', '#FFA300', '#f05023', '#00843D') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('utsa', '#0C2340', '#F15A22', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('valparaiso', '#381e0e', '#613318', '#ffcc00') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('vanderbilt', '#000000', '#866d4b', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('vcu', '#ffb300', '#FFB300', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('vermont', '#007155', '#006666', '#FFD600') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('villanova', '#00205b', '#13b5ea', '#8B634B') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('virginia', '#232D4B', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('virginia-tech', '#630031', '#cf4420', '#630031') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('vmi', '#a71f23', '#ffd520', '#000000') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('wagner', '#00483a', '#b9bbbd', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('wake-forest', '#9E7E38', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('washington', '#4B2E83', '#b7a57a', '#85754d') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('washington-st', '#981E32', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('weber-st', '#492365', '#4B4945', '#FFFFFF') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('west-ga', '#0656A5', '#DA2128', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('west-virginia', '#002855', '#EAAA00', '#002855') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('western-caro', '#592c88', '#C1A875', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('western-ill', '#59327E', '#F8C823', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('western-ky', '#c60c30', '#1E1E1E', '#A2A4A3') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('western-mich', '#6C4023', '#B5A167', '#AAA8AA') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('wichita-st', '#FFCD00', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('william-and-mary', '#115740', '#F0B323', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('william-mary', '#115740', '#F0B323', NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('winthrop', '#660000', '#F0B323', '#ffffff') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('wisconsin', '#c5050c', '#ffffff', '#C5050C') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('wofford', '#886E4C', '#FFFFFF', '#C7B37F') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('wright-st', '#026937', '#CEA052', '#FFE1A5') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('wyoming', '#ffc425', '#492f24', '#FFC425') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('xavier', '#0C2340', '#9EA2A2', '#0099CC') ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('yale', '#00356b', NULL, NULL) ON CONFLICT (seo_name) DO NOTHING;
INSERT INTO team_colors (seo_name, primary_color, secondary_color, tertiary_color) VALUES ('youngstown-st', '#C8102E', '#F3D54E', NULL) ON CONFLICT (seo_name) DO NOTHING;
