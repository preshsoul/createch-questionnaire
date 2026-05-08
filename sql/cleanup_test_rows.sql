-- Remove known synthetic questionnaire submissions from the dataset.
-- Safe to run multiple times.

DELETE FROM responses
WHERE pseudonym IN ('TEST123', 'PTEST1', 'PTEST2', 'PTEST3');

-- If legacy contact rows exist without cascading cleanup, remove them too.
DELETE FROM followup_contacts
WHERE pseudonym IN ('TEST123', 'PTEST1', 'PTEST2', 'PTEST3');

