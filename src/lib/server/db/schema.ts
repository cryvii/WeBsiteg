import { pgTable, serial, text, boolean, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected', 'paid', 'completed']);

// Tables
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: text('username').notNull().unique(),
    password_hash: text('password_hash').notNull(),
});

export const settings = pgTable('settings', {
    id: boolean('id').primaryKey().default(true), // Singleton enforcement trick: always true
    is_commissions_open: boolean('is_commissions_open').default(true).notNull(),
    queue_limit: integer('queue_limit').default(200).notNull(),
});

export const commissions = pgTable('commissions', {
    id: serial('id').primaryKey(),
    client_name: text('client_name').notNull(),
    email: text('email').notNull(),
    description: text('description').notNull(),
    price: integer('price'), // In cents or whole dollars
    status: statusEnum('status').default('pending').notNull(),
    rejection_reason: text('rejection_reason'),
    accepted_at: timestamp('accepted_at'), // When admin accepted the commission
    completion_date: timestamp('completion_date'), // When admin committed to completing
    scheduled_at: timestamp('scheduled_at'), // When artist scheduled a time to work on it
    reference_images: text('reference_images').default('[]'), // JSON array of image URLs
    paid_amount: integer('paid_amount'), // Amount paid for the commission
    payment_reference: text('payment_reference'), // Payment reference ID/transaction ID
    final_result_images: text("final_result_images").default("[]"),
    created_at: timestamp('created_at').defaultNow().notNull(),
});
