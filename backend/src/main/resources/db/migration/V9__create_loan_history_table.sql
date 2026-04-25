CREATE TABLE IF NOT EXISTS loan_history (
    id          BIGSERIAL PRIMARY KEY,
    loan_id     BIGINT       NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    action      VARCHAR(30)  NOT NULL,   -- SUBMITTED | APPROVED | REJECTED | RETURNED
    actor_id    BIGINT       REFERENCES users(id),
    actor_name  VARCHAR(255),
    notes       TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_history_loan_id ON loan_history(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_history_created_at ON loan_history(created_at DESC);
