-- Update bracket selections with completed play-in game results
UPDATE brackets
SET selections = array_replace(selections, '16 Ala. St/St. Francis', '16 Alabama St.');

UPDATE brackets
SET selections = array_replace(selections, '16 AMER/Mt. SM', '16 Mount St. Mary''s');

UPDATE brackets
SET selections = array_replace(selections, '11 Texas/Xavier', '11 Xavier');

UPDATE brackets
SET selections = array_replace(selections, '11 SDSU/UNC', '11 North Carolina');