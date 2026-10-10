# Payroll

The calculation engine is a pure Decimal-only domain package. Payroll actions orchestrate persistence, approvals, freezing, and amendment/reversal flows; they pass normalized facts and selected rule versions into the engine.

Submitted Salary Slips are frozen ledger snapshots. Corrections create linked revisions and preserve the original record.
