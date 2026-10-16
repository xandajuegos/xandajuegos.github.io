-- Cumpleaños de la cuenta (solo mes y día; el año no se guarda). Se puede ejecutar más de una vez.
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_month SMALLINT CHECK (birth_month BETWEEN 1 AND 12);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_day SMALLINT CHECK (birth_day BETWEEN 1 AND 31);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday_changed_at TIMESTAMPTZ;
