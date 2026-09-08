import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const timestamps = { createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull() };

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }), code: text('code').notNull().unique(), marketplace: text('marketplace').notNull(), sourceUrl: text('source_url').notNull(), affiliateUrl: text('affiliate_url').notNull(), name: text('name').notNull(), description: text('description').notNull().default(''), imageUrl: text('image_url').notNull().default(''), videoUrl: text('video_url'), status: text('status').notNull().default('draft'), disclosure: text('disclosure').notNull().default('제휴 링크를 통한 구매 시 수수료를 받을 수 있습니다.'), ...timestamps,
});
export const generationJobs = sqliteTable('generation_jobs', { id: integer('id').primaryKey({ autoIncrement: true }), productId: integer('product_id').notNull().references(() => products.id), status: text('status').notNull().default('queued'), prompt: text('prompt').notNull(), canvasId: text('canvas_id'), taskId: text('task_id'), resultUrl: text('result_url'), errorMessage: text('error_message'), ...timestamps });
export const clickEvents = sqliteTable('click_events', { id: integer('id').primaryKey({ autoIncrement: true }), productId: integer('product_id').notNull().references(() => products.id), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull() });
export type Product = typeof products.$inferSelect;
export type GenerationJob = typeof generationJobs.$inferSelect;
