---
name: supabase-postgres-best-practices
description: Postgres performance optimization and best practices from Supabase. Apply when writing database queries, designing schemas, setting up RLS, or optimizing Supabase/Postgres performance.
---

# Supabase Postgres Best Practices

Comprehensive Postgres performance optimization guide from Supabase. Reference these guidelines when writing queries, designing schemas, or optimizing database performance.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

## Quick Reference

### 1. Query Performance (CRITICAL)

- **Missing indexes**: Add indexes on WHERE/JOIN columns. 100-1000x faster. Example: `CREATE INDEX ON orders (customer_id);`
- **Composite indexes**: Multi-column indexes. Place equality columns first, range columns last. 5-10x faster.
- **Covering indexes**: Use `INCLUDE` for index-only scans. Skips table heap. 2-5x faster.
- **Index types**: B-tree (default), GIN (arrays/JSONB/full-text), GiST (geometric/range), BRIN (time-series, 10-100x smaller), Hash (equality-only).
- **Partial indexes**: WHERE clause filter. 5-20x smaller. Common for soft-delete: `WHERE deleted_at IS NULL`.

### 2. Connection Management (CRITICAL)

- **Connection pooling**: Use PgBouncer. Pool size: `(CPU cores * 2) + spindle_count`. Transaction mode for most apps.
- **Connection limits**: `max_connections = (RAM_MB / 5) - reserved`. Ensure `work_mem * max_connections` ≤ 25% RAM.
- **Idle timeouts**: `idle_in_transaction_session_timeout = '30s'`, `idle_session_timeout = '10min'`.
- **Prepared statements**: Avoid named prepared statements with transaction pooling. Use unnamed statements or session mode (port 6543 vs 5432).

### 3. Security & RLS (CRITICAL)

- **RLS basics**: `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;` with policies like `USING (user_id = auth.uid())`.
- **RLS performance**: Wrap `auth.uid()` in subselect `(SELECT auth.uid())` to avoid per-row function calls (100x faster). Index policy columns.
- **Least privilege**: Never use superuser for app queries. Create read-only/writer roles. Revoke public schema defaults.

### 4. Schema Design (HIGH)

- **Safe constraints**: Use DO blocks with `pg_constraint` checks for `ADD CONSTRAINT IF NOT EXISTS`.
- **Data types**: `bigint identity` for IDs, `text` (not `varchar(n)`), `timestamptz` (not `timestamp`), `numeric` for money, `boolean`.
- **FK indexes**: Always index foreign key columns. Postgres does NOT auto-index them.
- **Lowercase identifiers**: Use `snake_case`. Quoted mixed-case requires quotes forever.
- **Partitioning**: Partition tables > 100M rows by range for time-series data.
- **Primary keys**: `bigint identity` for single DB. UUIDv7 for distributed. Avoid random UUIDv4 on large tables.

### 5. Concurrency & Locking (MEDIUM-HIGH)

- **Advisory locks**: `pg_advisory_lock` / `pg_try_advisory_lock` for app-level coordination.
- **Deadlock prevention**: Acquire locks in consistent order (`ORDER BY id FOR UPDATE`). Monitor `pg_stat_database.deadlocks`.
- **Short transactions**: Keep transactions short. `statement_timeout = '30s'`. 3-5x throughput improvement.
- **Skip locked**: `FOR UPDATE SKIP LOCKED` for queue processing. 10x throughput.

### 6. Data Access Patterns (MEDIUM)

- **Batch inserts**: Multi-row INSERT for up to ~1000 rows. Use COPY for bulk. 10-50x faster.
- **N+1 elimination**: Use `= ANY($1::bigint[])` or JOINs. One round trip instead of N.
- **Cursor pagination**: `WHERE id > $last_id ORDER BY id LIMIT 20` instead of OFFSET. Consistent O(1).
- **Upsert**: `INSERT ... ON CONFLICT DO UPDATE` for atomic upserts.

### 7. Monitoring (LOW-MEDIUM)

- **EXPLAIN ANALYZE**: Use `EXPLAIN (ANALYZE, BUFFERS)`. Key indicators: Seq Scan (missing index), Rows Removed by Filter (poor selectivity), read >> hit (uncached).
- **pg_stat_statements**: Find slowest queries by `total_exec_time`, `mean_exec_time`, `calls`.
- **VACUUM/ANALYZE**: Tune autovacuum for high-churn tables. Lower `autovacuum_analyze_scale_factor` to 0.02.

### 8. Advanced Features (LOW)

- **Full-text search**: Use `tsvector` + GIN index instead of `LIKE '%pattern%'`. 100x faster with `ts_rank()`.
- **JSONB indexing**: GIN for `@>`, `?`, `?&`, `?|`. Expression indexes for specific keys. `jsonb_path_ops` for smaller indexes.
