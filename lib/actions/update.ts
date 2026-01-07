"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../auth";
import { prisma } from "../prisma";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().nonnegative("Price must be non-negative"),
  quantity: z.coerce.number().int().min(0, "Quantity must be non-negative"),
  sku: z.string().optional(),
  lowStockAt: z.coerce.number().int().min(0).optional(),
});

export async function updateProduct(formData: FormData) {
  const user = await getCurrentUser();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Product ID is required");
  }

  const parsed = ProductSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    sku: formData.get("sku") || undefined,
    lowStockAt: formData.get("lowStockAt") || undefined,
  });

  if (!parsed.success) {
    throw new Error("Validation failed");
  }

  try {
    await prisma.product.updateMany({
      where: {
        id: id,
        userId: user.id, // 🔐 biar ga update produk orang lain
      },
      data: parsed.data,
    });

    redirect("/inventory");
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    throw error;
  }
}
