-- Add cost breakdown fields for wedding cases
-- These fields allow storing detailed cost information (cost per plate and venue cost)
-- while total_cost remains the primary field for display

ALTER TABLE cases
ADD COLUMN IF NOT EXISTS cost_per_plate NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS venue_cost NUMERIC(10, 2);

-- Add comments for documentation
COMMENT ON COLUMN cases.cost_per_plate IS 'Cost per plate/meal in ILS';
COMMENT ON COLUMN cases.venue_cost IS 'Venue/hall cost in ILS';
