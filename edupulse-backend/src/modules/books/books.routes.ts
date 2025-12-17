import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  createBookSchema,
  updateBookSchema,
  bookQuerySchema,
  booksListResponseSchema,
  availabilityResponseSchema,
  booksStatisticsResponseSchema,
} from './books.dto.js';
import { booksService } from './books.service.js';
import { validate } from '../../middleware/validation.middleware.js';
import { requireTeacherOrStudent } from '../../middleware/roles.middleware.js';
import { endpointRateLimit } from '../../middleware/rate-limit.middleware.js';

/**
 * Books Routes
 */
export async function booksRoutes(app: FastifyInstance): Promise<void> {
  const service = booksService;

  // ===============================
  // GET /api/books
  // Get all books with pagination and filtering
  // ===============================
  app.get(
    '/',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        querystring: bookQuerySchema,
        response: {
          200: booksListResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const queryOptions = bookQuerySchema.parse(request.query);
        const result = await service.findAll(queryOptions);

        reply.send({
          success: true,
          message: 'Books retrieved successfully',
          data: result.data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            hasNext: result.page < Math.ceil(result.totalItems / result.limit),
            hasPrev: result.page > 1,
          },
        });
      } catch (e: any) {
        reply.code(500).send({
          success: false,
          error: {
            message: 'Failed to retrieve books',
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }
    }
  );

  // ===============================
  // GET /api/books/search
  // Search books by query
  // ===============================
  app.get(
    '/search',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        querystring: bookQuerySchema.omit({ search: true }),
        response: {
          200: booksListResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const { search } = request.query as any;
        const queryOptions = bookQuerySchema
          .omit({ search: true })
          .parse(request.query);
        const result = await service.searchBooks(search, queryOptions);

        reply.send({
          success: true,
          message: `Found ${result.data.length} books matching "${search}"`,
          data: result.data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            hasNext: result.page < Math.ceil(result.totalItems / result.limit),
            hasPrev: result.page > 1,
          },
        });
      } catch (e: any) {
        reply.code(500).send({
          success: false,
          error: {
            message: 'Failed to search books',
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }
    }
  );

  // ===============================
  // GET /api/books/available
  // Get available books only
  // ===============================
  app.get(
    '/available',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        querystring: bookQuerySchema,
        response: {
          200: booksListResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const queryOptions = bookQuerySchema.parse(request.query);
        const result = await service.findAvailableBooks(queryOptions);

        reply.send({
          success: true,
          message: 'Available books retrieved successfully',
          data: result.data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            hasNext: result.page < Math.ceil(result.totalItems / result.limit),
            hasPrev: result.page > 1,
          },
        });
      } catch (e: any) {
        reply.code(500).send({
          success: false,
          error: {
            message: 'Failed to retrieve available books',
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }
    }
  );

  // ===============================
  // GET /api/books/popular
  // Get popular books (most borrowed)
  // ===============================
  app.get(
    '/popular',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        querystring: z.object({
          limit: z.coerce.number().int().positive().max(50).default(10),
        }),
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const { limit } = request.query as any;
        const popularBooks = await service.getPopularBooks(limit);

        reply.send({
          success: true,
          message: 'Popular books retrieved successfully',
          data: popularBooks,
        });
      } catch (e: any) {
        reply.code(500).send({
          success: false,
          error: {
            message: 'Failed to retrieve popular books',
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }
    }
  );

  // ===============================
  // GET /api/books/recent
  // Get recently added books
  // ===============================
  app.get(
    '/recent',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        querystring: z.object({
          limit: z.coerce.number().int().positive().max(50).default(10),
        }),
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const { limit } = request.query as any;
        const recentBooks = await service.getRecentBooks(limit);

        reply.send({
          success: true,
          message: 'Recently added books retrieved successfully',
          data: recentBooks,
        });
      } catch (e: any) {
        reply.code(500).send({
          success: false,
          error: {
            message: 'Failed to retrieve recent books',
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }
    }
  );

  // ===============================
  // GET /api/books/category/:category
  // Get books by category
  // ===============================
  app.get(
    '/category/:category',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        params: {
          type: 'object',
          properties: {
            category: { type: 'string' },
          },
          required: ['category'],
        },
        querystring: bookQuerySchema,
        response: {
          200: booksListResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const { category } = request.params as { category: string };
        const queryOptions = bookQuerySchema.parse(request.query);
        const result = await service.findByCategory(category, queryOptions);

        reply.send({
          success: true,
          message: `Books in category "${category}" retrieved successfully`,
          data: result.data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            hasNext: result.page < Math.ceil(result.totalItems / result.limit),
            hasPrev: result.page > 1,
          },
        });
      } catch (e: any) {
        reply.code(500).send({
          success: false,
          error: {
            message: 'Failed to retrieve books by category',
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }
    }
  );

  // ===============================
  // GET /api/books/author/:author
  // Get books by author
  // ===============================
  app.get(
    '/author/:author',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        params: {
          type: 'object',
          properties: {
            author: { type: 'string' },
          },
          required: ['author'],
        },
        querystring: bookQuerySchema,
        response: {
          200: booksListResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const { author } = request.params as { author: string };
        const queryOptions = bookQuerySchema.parse(request.query);
        const result = await service.findByAuthor(author, queryOptions);

        reply.send({
          success: true,
          message: `Books by "${author}" retrieved successfully`,
          data: result.data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            hasNext: result.page < Math.ceil(result.totalItems / result.limit),
            hasPrev: result.page > 1,
          },
        });
      } catch (e: any) {
        reply.code(500).send({
          success: false,
          error: {
            message: 'Failed to retrieve books by author',
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }
    }
  );

  // ===============================
  // GET /api/books/isbn/:isbn
  // Get book by ISBN
  // ===============================
  app.get(
    '/isbn/:isbn',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        params: {
          type: 'object',
          properties: {
            isbn: { type: 'string' },
          },
          required: ['isbn'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const { isbn } = request.params as { isbn: string };
        const book = await service.findByIsbn(isbn);

        reply.send({
          success: true,
          message: 'Book retrieved successfully',
          data: book,
        });
      } catch (e: any) {
        if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
          reply.code(404).send({
            success: false,
            error: {
              message: 'Book not found',
              code: 'NOT_FOUND',
            },
          });
        } else {
          reply.code(500).send({
            success: false,
            error: {
              message: 'Failed to retrieve book',
              code: 'INTERNAL_SERVER_ERROR',
            },
          });
        }
      }
    }
  );

  // ===============================
  // GET /api/books/:id
  // Get book by ID
  // ===============================
  app.get(
    '/:id',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const { id } = request.params as { id: string };
        const book = await service.findById(id);

        reply.send({
          success: true,
          message: 'Book retrieved successfully',
          data: book,
        });
      } catch (e: any) {
        if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
          reply.code(404).send({
            success: false,
            error: {
              message: 'Book not found',
              code: 'NOT_FOUND',
            },
          });
        } else {
          reply.code(500).send({
            success: false,
            error: {
              message: 'Failed to retrieve book',
              code: 'INTERNAL_SERVER_ERROR',
            },
          });
        }
      }
    }
  );

  // ===============================
  // POST /api/books
  // Create a new book
  // ===============================
  app.post(
    '/',
    {
      preHandler: [
        endpointRateLimit(),
        requireTeacherOrStudent,
        validate({ body: createBookSchema }),
      ],
      schema: {
        body: createBookSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const bookData = request.body as any;
        const book = await service.create(bookData);

        reply.code(201).send({
          success: true,
          message: 'Book created successfully',
          data: book,
        });
      } catch (e: any) {
        if (e?.message && typeof e.message === 'string' && e.message.includes('already exists')) {
          reply.code(409).send({
            success: false,
            error: {
              message: e.message,
              code: 'CONFLICT',
            },
          });
        } else {
          reply.code(500).send({
            success: false,
            error: {
              message: 'Failed to create book',
              code: 'INTERNAL_SERVER_ERROR',
            },
          });
        }
      }
    }
  );

  // ===============================
  // PUT /api/books/:id
  // Update book
  // ===============================
  app.put(
    '/:id',
    {
      preHandler: [
        endpointRateLimit(),
        requireTeacherOrStudent,
        validate({ body: updateBookSchema }),
      ],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: updateBookSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const { id } = request.params as { id: string };
        const updateData = request.body as any;
        const book = await service.update(id, updateData);

        reply.send({
          success: true,
          message: 'Book updated successfully',
          data: book,
        });
      } catch (e: any) {
        if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
          reply.code(404).send({
            success: false,
            error: {
              message: 'Book not found',
              code: 'NOT_FOUND',
            },
          });
        } else if (e?.message && typeof e.message === 'string' && e.message.includes('already exists')) {
          reply.code(409).send({
            success: false,
            error: {
              message: e.message,
              code: 'CONFLICT',
            },
          });
        } else {
          reply.code(500).send({
            success: false,
            error: {
              message: 'Failed to update book',
              code: 'INTERNAL_SERVER_ERROR',
            },
          });
        }
      }
    }
  );

  // ===============================
  // DELETE /api/books/:id
  // Delete book
  // ===============================
  app.delete(
    '/:id',
    {
      preHandler: [endpointRateLimit(), requireTeacherOrStudent],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const { id } = request.params as { id: string };
        await service.delete(id);

        reply.send({
          success: true,
          message: 'Book deleted successfully',
        });
      } catch (e: any) {
        if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
          reply.code(404).send({
            success: false,
            error: {
              message: 'Book not found',
              code: 'NOT_FOUND',
            },
          });
        } else if (e?.message && typeof e.message === 'string' && e.message.includes('active loans')) {
          reply.code(400).send({
            success: false,
            error: {
              message: e.message,
              code: 'BAD_REQUEST',
            },
          });
        } else {
          reply.code(500).send({
            success: false,
            error: {
              message: 'Failed to delete book',
              code: 'INTERNAL_SERVER_ERROR',
            },
          });
        }
      }
    }
  );
}
