import { defaultColorId, primaryImage, secondaryPhoto } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";
import { QuickAdd } from "./QuickAdd";
import { ListViewTracker, ProductLink } from "./Tracking";

export function ProductCard({
  product,
  listId,
  index,
  priority = false,
}: {
  product: Product;
  listId: string;
  index: number;
  priority?: boolean;
}) {
  const colorId = defaultColorId(product);
  const color = product.colors.find((c) => c.id === colorId);
  const image = primaryImage(product, colorId);
  const hover = secondaryPhoto(product, colorId);
  const href = `/products/${product.slug}`;
  const item = { item_id: product.id, item_name: product.name, price: product.price.amount / 100, index };

  return (
    <article className="group relative flex flex-col">
      <ProductLink href={href} listId={listId} item={item} tabIndex={-1} aria-hidden="true" className="relative block">
        <ProductImage
          image={image}
          alt=""
          sizes="(min-width: 1024px) 24vw, (min-width: 768px) 32vw, 48vw"
          priority={priority}
          showKindBadge
        />
        {hover && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <ProductImage image={hover} alt="" sizes="(min-width: 1024px) 24vw, (min-width: 768px) 32vw, 48vw" />
          </div>
        )}
      </ProductLink>

      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[0.9375rem] font-semibold leading-snug">
            <ProductLink href={href} listId={listId} item={item} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-green">
              {product.name}
            </ProductLink>
          </h3>
          <p className="shrink-0 text-[0.9375rem] tabular-nums">{formatMoney(product.price)}</p>
        </div>
        <p className="mt-0.5 text-sm text-ink-soft">{product.fit.label}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
          <span className="flex -space-x-1" aria-hidden="true">
            {product.colors.map((c) => (
              <span key={c.id} className="size-3.5 rounded-full border border-ivory ring-1 ring-black/10" style={{ backgroundColor: c.swatch }} />
            ))}
          </span>
          <span>
            Shown in {color?.name}
            {product.colors.length > 1 && ` · ${product.colors.length} colors`}
            <span className="sr-only">: {product.colors.map((c) => c.name).join(", ")}</span>
          </span>
        </div>
        {/* Sits above the card's stretched link so it stays independently clickable. */}
        <div className="relative z-10 mt-1.5">
          <QuickAdd product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  listId,
  columns = 4,
  priorityCount = 2,
}: {
  products: Product[];
  listId: string;
  columns?: 3 | 4;
  priorityCount?: number;
}) {
  return (
    <>
      <ListViewTracker
        listId={listId}
        items={products.map((p, i) => ({ item_id: p.id, item_name: p.name, price: p.price.amount / 100, index: i }))}
      />
      <ul
        className={`grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 ${columns === 4 ? "lg:grid-cols-4" : ""}`}
      >
        {products.map((product, i) => (
          <li key={product.id} className="reveal">
            <ProductCard product={product} listId={listId} index={i} priority={i < priorityCount} />
          </li>
        ))}
      </ul>
    </>
  );
}
