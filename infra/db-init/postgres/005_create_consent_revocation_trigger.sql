-- Migration: Create trigger to auto-delete participant data on consent revocation
-- Description: Automatically removes participant's shared data when consent is revoked
-- Date: 2025-11-12

-- Function to delete participant data when consent is revoked
CREATE OR REPLACE FUNCTION delete_participant_data_on_consent_revoke()
RETURNS TRIGGER AS $$
BEGIN
  -- If consent changed from true to false
  IF OLD.has_consented = TRUE AND NEW.has_consented = FALSE THEN
    -- Delete the participant's shared data from study_participant_data
    DELETE FROM study_participant_data
    WHERE study_id = NEW.study_id
      AND participant_wallet = NEW.participant_wallet;
    
    -- Invalidate the aggregated data cache for this study
    UPDATE studies
    SET aggregation_invalidated_at = NOW()
    WHERE id = NEW.study_id;
    
    RAISE NOTICE 'Participant data deleted and aggregation invalidated for study_id: %, participant: %', 
                 NEW.study_id, NEW.participant_wallet;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on study_participations table
DROP TRIGGER IF EXISTS trigger_consent_revoke_cleanup ON study_participations;

CREATE TRIGGER trigger_consent_revoke_cleanup
  AFTER UPDATE OF has_consented ON study_participations
  FOR EACH ROW
  WHEN (OLD.has_consented IS DISTINCT FROM NEW.has_consented)
  EXECUTE FUNCTION delete_participant_data_on_consent_revoke();

COMMENT ON FUNCTION delete_participant_data_on_consent_revoke() IS 
  'Automatically deletes participant shared data and invalidates aggregation cache when consent is revoked';
