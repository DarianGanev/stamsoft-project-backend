import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListListingsQueryDto } from './dto/list-listings-query.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { Listing, ListingRecord } from './listing.types';

@Injectable()
export class ListingsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async list(query: ListListingsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const filters: string[] = ["l.status = 'published'"];
    const params: unknown[] = [];

    this.addFilter(filters, params, 'l.brand_id =', query.brandId);
    this.addFilter(filters, params, 'l.model_id =', query.modelId);
    this.addFilter(filters, params, 'l.fuel =', query.fuel);
    this.addFilter(filters, params, 'l.transmission =', query.transmission);
    this.addFilter(filters, params, 'l.location ILIKE', query.location, true);
    this.addFilter(filters, params, 'l.price >=', query.minPrice);
    this.addFilter(filters, params, 'l.price <=', query.maxPrice);
    this.addFilter(filters, params, 'l.year >=', query.minYear);
    this.addFilter(filters, params, 'l.year <=', query.maxYear);

    const whereClause = filters.join(' AND ');
    const totalResult = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM listings l WHERE ${whereClause}`,
      params,
    );
    const result = await this.databaseService.query<ListingRecord>(
      `${this.listingSelectSql()}
       WHERE ${whereClause}
       GROUP BY l.id, b.name, m.name
       ORDER BY l.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    return {
      data: result.rows.map((row) => this.toListing(row)),
      meta: {
        page,
        limit,
        total: Number(totalResult.rows[0]?.count ?? 0),
      },
    };
  }

  async findPublished(id: string): Promise<Listing> {
    const listing = await this.findById(id, "l.status = 'published'");

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    return listing;
  }

  async create(userId: string, input: CreateListingDto): Promise<Listing> {
    const result = await this.databaseService.query<{ id: string }>(
      `
        INSERT INTO listings (
          user_id, brand_id, model_id, title, description, year, mileage_km,
          fuel, transmission, location, contact_name, contact_phone,
          contact_email, price, currency, status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16
        )
        RETURNING id
      `,
      [
        userId,
        input.brandId,
        input.modelId,
        input.title,
        input.description ?? null,
        input.year ?? null,
        input.mileageKm ?? null,
        input.fuel ?? null,
        input.transmission ?? null,
        input.location ?? null,
        input.contactName ?? null,
        input.contactPhone ?? null,
        input.contactEmail ?? null,
        input.price,
        input.currency ?? 'BGN',
        input.status ?? 'published',
      ],
    );

    return this.findOwned(result.rows[0].id, userId);
  }

  async update(
    id: string,
    userId: string,
    input: UpdateListingDto,
  ): Promise<Listing> {
    await this.ensureOwner(id, userId);

    const updates: string[] = [];
    const params: unknown[] = [];

    this.addUpdate(updates, params, 'brand_id', input.brandId);
    this.addUpdate(updates, params, 'model_id', input.modelId);
    this.addUpdate(updates, params, 'title', input.title);
    this.addUpdate(updates, params, 'description', input.description);
    this.addUpdate(updates, params, 'year', input.year);
    this.addUpdate(updates, params, 'mileage_km', input.mileageKm);
    this.addUpdate(updates, params, 'fuel', input.fuel);
    this.addUpdate(updates, params, 'transmission', input.transmission);
    this.addUpdate(updates, params, 'location', input.location);
    this.addUpdate(updates, params, 'contact_name', input.contactName);
    this.addUpdate(updates, params, 'contact_phone', input.contactPhone);
    this.addUpdate(updates, params, 'contact_email', input.contactEmail);
    this.addUpdate(updates, params, 'price', input.price);
    this.addUpdate(updates, params, 'currency', input.currency);
    this.addUpdate(updates, params, 'status', input.status);

    if (updates.length > 0) {
      await this.databaseService.query(
        `
          UPDATE listings
          SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id = $${params.length + 1}
        `,
        [...params, id],
      );
    }

    return this.findOwned(id, userId);
  }

  async remove(id: string, userId: string) {
    await this.ensureOwner(id, userId);
    await this.databaseService.query('DELETE FROM listings WHERE id = $1', [id]);

    return { message: 'Listing deleted successfully.' };
  }

  private async findOwned(id: string, userId: string): Promise<Listing> {
    const listing = await this.findById(id, 'l.user_id = $2', [userId]);

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    return listing;
  }

  private async ensureOwner(id: string, userId: string) {
    const result = await this.databaseService.query<{ user_id: string }>(
      'SELECT user_id FROM listings WHERE id = $1',
      [id],
    );
    const listing = result.rows[0];

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    if (listing.user_id !== userId) {
      throw new ForbiddenException('You can only modify your own listings.');
    }
  }

  private async findById(
    id: string,
    extraCondition: string,
    extraParams: unknown[] = [],
  ): Promise<Listing | null> {
    const result = await this.databaseService.query<ListingRecord>(
      `${this.listingSelectSql()}
       WHERE l.id = $1 AND ${extraCondition}
       GROUP BY l.id, b.name, m.name`,
      [id, ...extraParams],
    );
    const row = result.rows[0];

    return row ? this.toListing(row) : null;
  }

  private listingSelectSql() {
    return `
      SELECT
        l.id,
        l.user_id,
        l.brand_id,
        b.name AS brand_name,
        l.model_id,
        m.name AS model_name,
        l.title,
        l.description,
        l.year,
        l.mileage_km,
        l.fuel,
        l.transmission,
        l.location,
        l.contact_name,
        l.contact_phone,
        l.contact_email,
        l.price,
        l.currency,
        l.status,
        l.created_at,
        l.updated_at,
        (
          SELECT i.image_url
          FROM images i
          WHERE i.listing_id = l.id
          ORDER BY i.sort_order ASC, i.created_at ASC
          LIMIT 1
        ) AS primary_image_url,
        COALESCE(
          json_agg(
            json_build_object(
              'id', img.id,
              'url', img.image_url,
              'altText', img.alt_text,
              'sortOrder', img.sort_order
            )
            ORDER BY img.sort_order ASC, img.created_at ASC
          ) FILTER (WHERE img.id IS NOT NULL),
          '[]'
        ) AS images
      FROM listings l
      JOIN brands b ON b.id = l.brand_id
      JOIN models m ON m.id = l.model_id
      LEFT JOIN images img ON img.listing_id = l.id
    `;
  }

  private toListing(row: ListingRecord): Listing {
    return {
      id: row.id,
      userId: row.user_id,
      brandId: row.brand_id,
      brandName: row.brand_name,
      modelId: row.model_id,
      modelName: row.model_name,
      title: row.title,
      description: row.description,
      year: row.year,
      mileageKm: row.mileage_km,
      fuel: row.fuel,
      transmission: row.transmission,
      location: row.location,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      price: Number(row.price),
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      images: row.images ?? [],
      primaryImageUrl: row.primary_image_url,
    };
  }

  private addFilter(
    filters: string[],
    params: unknown[],
    expression: string,
    value: string | number | undefined | null,
    wrapLike = false,
  ) {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.push(wrapLike ? `%${String(value)}%` : value);
    filters.push(`${expression} $${params.length}`);
  }

  private addUpdate(
    updates: string[],
    params: unknown[],
    column: string,
    value: unknown,
  ) {
    if (value === undefined) {
      return;
    }

    params.push(value);
    updates.push(`${column} = $${params.length}`);
  }
}
