import { HttpError } from 'wasp/server';
import { type Template, type Recipient, type Contact, type PlacedAsset, type Document, type User } from 'wasp/entities';
import { CompleteTemplateObject, PaginatedResponse, PaginationInput } from '../../types';

// Define RecipientWithContact
export type RecipientWithContact = Recipient & { contact: Contact };

// Define a specific type for the query
export type GetAllTemplateSubmissions<T, U> = (
  args: T,
  context: {
    user?: { id: string };
    entities: {
      Template: any;
      PlacedAsset: any;
      Document: any;
      Recipient: any;
      Contact: any;
      User: any;
    }
  }
) => Promise<U>;

export const getAllTemplateSubmissions: GetAllTemplateSubmissions<PaginationInput, PaginatedResponse<CompleteTemplateObject>> = async (
  args: PaginationInput,
  context: {
    user?: { id: string };
    entities: {
      Template: any;
      PlacedAsset: any;
      Document: any;
      Recipient: any;
      Contact: any;
      User: any;
    }
  }
) => {
  console.log("IP Address", (context as any).clientIp || "Not", )
  
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (!context.entities?.Template) {
    throw new HttpError(500, "Database configuration error");
  }

  // Default values and validation
  const page = Number(args.page) || 1;
  const pageSize = Number(args.pageSize) || 10;

  if (!Number.isInteger(page) || !Number.isInteger(pageSize) || page < 1 || pageSize < 1) {
    throw new HttpError(400, "Invalid pagination parameters");
  }

  try {
    const skip = (page - 1) * pageSize;
    const [templates, total] = await Promise.all([
      context.entities.Template.findMany({
        where: {
          user: { id: context.user.id },
          status: { not: "Draft" },
        },
        include: {
          placedAssets: {
            include: {
              recipient: { include: { contact: true } },
            },
          },
          document: {
            include: { placedAssets: true },
          },
          recipients: {
            include: { contact: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      context.entities.Template.count({
        where: {
          user: { id: context.user.id },
          status: { not: "Draft" },
        },
      }),
    ]);

    return {
      items: templates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error fetching template submissions:", error);
    throw new HttpError(500, "Failed to fetch template submissions");
  }
};