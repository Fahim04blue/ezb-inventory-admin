INSERT INTO "rate_types" ("name", "code", "description", "isActive", "createdAt", "updatedAt")
VALUES
  ('Customer Selling Rate', 'CUSTOMER_SELLING', 'Rate used to quote or charge customers.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Actual Card Rate', 'ACTUAL_CARD', 'Real card or bank rate used when purchasing.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Customer Weight Charge', 'CUSTOMER_WEIGHT_CHARGE', 'Weight charge rate charged to customers.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Actual Cargo Cost', 'ACTUAL_CARGO_COST', 'Real cargo or shipping cost paid by the business.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Cargo Payment', 'CARGO_PAYMENT', 'Rate used for cargo or shipping payments if needed.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Supplier Payment', 'SUPPLIER_PAYMENT', 'Rate used for supplier or shop payments if needed.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
