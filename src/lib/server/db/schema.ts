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
    created_at: timestamp('created_at').defaultNow().notNull(),
});
