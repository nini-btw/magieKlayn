"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Trash2Icon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PackageIcon,
  XIcon,
  CheckIcon,
} from "lucide-react";

import { Button } from "@/presentation/components/ui/Button";
import { Input, Textarea } from "@/presentation/components/ui/Input";
import { QuantityStepper } from "@/presentation/components/ui/QuantityStepper";
import {
  selectCartItems,
  selectCartTotal,
  removeItem,
  updateQuantity,
  clearCart,
  setGiftNote,
  selectGiftNote,
  setBoxColors,
  selectBoxColors,
  selectMaxBoxCount,
  selectTotalItemCount,
  type BoxColor,
} from "@/presentation/store/cart/cart.slice";
import { addToast } from "@/presentation/store/ui/ui.slice";
import { formatPrice } from "@/presentation/lib/utils";
import { fadeInUp } from "@/presentation/lib/animations";
import { useTranslations } from "next-intl";
import { WilayaCommuneSelect } from "@/presentation/components/features/WilayaCommuneSelect";
import type { DeliverySelection } from "@/domain/entities/delivery";
import { MAX_BOX_CAPACITY, calculateCoffretFee } from "@/domain/rules/cart.rules";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z
    .string()
    .transform((val) => val.replace(/[\s-]/g, ""))
    .pipe(
      z
        .string()
        .regex(
          /^0[567]\d{8}$/,
          "Phone must be 10 digits and start with 05, 06, or 07",
        ),
    ),
  deliveryZoneId: z.string().uuid("Delivery zone is required"),
  deliveryType: z.enum(["stop_desk", "home", "store_pickup"]),
  deliveryFee: z.number().min(0, "Delivery fee is required"),
});
type CheckoutFormData = z.infer<typeof checkoutSchema>;

const BOX_IMAGES: Record<BoxColor, string> = {
  white:
    "https://gaquniefolcmosxhctmg.supabase.co/storage/v1/object/public/magieKlayn/whiteBox.png",
  black:
    "https://gaquniefolcmosxhctmg.supabase.co/storage/v1/object/public/magieKlayn/blackBox.png",
};

/**
 * Product visual: real photo on a soft tint of its signature color.
 * Falls back to a solid-color placeholder swatch if no photo exists yet.
 */
const ProductThumb: React.FC<{
  image?: string;
  colorHex: string;
  name: string;
}> = ({ image, colorHex, name }) => (
  <div
    className="relative w-20 h-20 rounded-[var(--radius-main)] overflow-hidden flex-shrink-0"
    style={{
      background: image
        ? `color-mix(in srgb, ${colorHex} 14%, white)`
        : colorHex,
    }}
  >
    {image && (
      <Image src={image} alt={name} fill className="object-contain p-2" />
    )}
  </div>
);

/** A single white/black gift-box swatch card, used once per box slot. */
const BoxColorCard: React.FC<{
  color: BoxColor;
  isSelected: boolean;
  onSelect: () => void;
  t: ReturnType<typeof useTranslations>;
}> = ({ color, isSelected, onSelect, t }) => {
  // Backdrop behind each box swatch — darker neutral behind the white box
  // so its edges read clearly; a soft warm tint behind the black box.
  const CARD_BG: Record<BoxColor, string> = {
    white: "#eeeeee",
    black: "#ffffff",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col items-center justify-center gap-2 h-44 px-2 rounded-[var(--radius-main)] border-2 overflow-hidden transition-all duration-[var(--duration-base)] ease-[var(--ease-luxury)] cursor-pointer ${
        isSelected
          ? "border-[var(--color-text)] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)] scale-[1.02]"
          : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_-8px_rgba(0,0,0,0.18)]"
      }`}
      style={{ background: CARD_BG[color] }}
    >
      <AnimatePresence>
        {isSelected && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-2 left-2 w-5 h-5 rounded-full bg-[var(--color-text)] text-[var(--color-white)] flex items-center justify-center z-10"
          >
            <CheckIcon className="w-3 h-3" />
          </motion.span>
        )}
      </AnimatePresence>

      <div className="relative w-28 h-24 transition-transform duration-[var(--duration-base)] ease-[var(--ease-luxury)] group-hover:scale-105">
        <Image
          src={BOX_IMAGES[color]}
          alt={
            color === "white"
              ? t("cart.packaging.white") || "Coffret blanc"
              : t("cart.packaging.black") || "Coffret noir"
          }
          fill
          className="object-contain scale-150 drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]"
        />
      </div>
      <span className="text-xs font-medium text-[var(--color-text)] capitalize tracking-wide">
        {color === "white"
          ? t("cart.packaging.white") || "Blanc"
          : t("cart.packaging.black") || "Noir"}
      </span>
    </button>
  );
};

/**
 * Box packaging selector — shown under the products list.
 * A box always holds exactly MAX_BOX_CAPACITY bottles. The customer picks
 * how many boxes they want (0..maxBoxCount) and a color per box; whatever
 * doesn't fit in a chosen box ships without one.
 */
const BoxPackagingSelector: React.FC<{
  boxColors: BoxColor[];
  maxBoxCount: number;
  itemCount: number;
  onChange: (colors: BoxColor[]) => void;
  t: ReturnType<typeof useTranslations>;
}> = ({ boxColors, maxBoxCount, itemCount, onChange, t }) => {
  const boxCount = boxColors.length;
  const boxedCount = boxCount * MAX_BOX_CAPACITY;
  const remainder = itemCount - boxedCount;
  const hasNextSlot = boxCount < maxBoxCount;

  const setColorAt = (index: number, color: BoxColor) => {
    onChange(boxColors.map((c, i) => (i === index ? color : c)));
  };

  // Picking a color on the empty "next" slot is what adds a box — no
  // separate stepper click needed.
  const addBox = (color: BoxColor) => {
    onChange([...boxColors, color]);
  };

  // Clicking the already-selected color on the LAST box removes it, so
  // removal order always stays well-defined (can't leave a gap).
  const removeLastBox = () => {
    onChange(boxColors.slice(0, -1));
  };

  return (
    <div className="mt-4 p-5 bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 mb-1">
        <PackageIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
        <h3 className="font-bold text-[var(--color-text)] text-sm">
          {t("cart.packaging.title") || "Coffret cadeau (optionnel)"}
        </h3>
      </div>

      {maxBoxCount === 0 ? (
        <p className="text-xs text-amber-600">
          {t("cart.packaging.notEligible", { count: itemCount })}
        </p>
      ) : (
        <>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            {t("cart.packaging.capacityNote") ||
              `Each box holds exactly ${MAX_BOX_CAPACITY} bottles.`}
          </p>

          <div className="space-y-4 mb-4">
            {boxColors.map((color, i) => {
              const isLast = i === boxColors.length - 1;
              return (
                <div key={i}>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    {t("cart.packaging.boxLabel", { n: i + 1 })}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {(["white", "black"] as const).map((c) => (
                      <BoxColorCard
                        key={c}
                        color={c}
                        isSelected={color === c}
                        onSelect={() =>
                          color === c && isLast
                            ? removeLastBox()
                            : setColorAt(i, c)
                        }
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {hasNextSlot && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                  {t("cart.packaging.addBox") || "Add a box"}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(["white", "black"] as const).map((c) => (
                    <BoxColorCard
                      key={c}
                      color={c}
                      isSelected={false}
                      onSelect={() => addBox(c)}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-[var(--color-text-secondary)]">
            {boxCount > 0
              ? t("cart.packaging.summary", {
                  boxed: boxedCount,
                  rest: remainder,
                })
              : t("cart.packaging.noneSelected") ||
                "No box selected — all bottles will ship normally."}
          </p>
        </>
      )}
    </div>
  );
};

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const t = useTranslations();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const giftNote = useSelector(selectGiftNote);
  const boxColors = useSelector(selectBoxColors);
  const maxBoxCount = useSelector(selectMaxBoxCount);
  const itemCount = useSelector(selectTotalItemCount);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [orderComplete, setOrderComplete] = React.useState(false);
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const [deliverySelection, setDeliverySelection] =
    React.useState<DeliverySelection | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const handleDeliveryChange = (selection: DeliverySelection | null) => {
    setDeliverySelection(selection);
    if (selection) {
      setValue("deliveryZoneId", selection.zoneId);
      setValue("deliveryType", selection.type);
      setValue("deliveryFee", selection.fee);
    } else {
      setValue("deliveryZoneId", "");
      setValue("deliveryType", undefined as unknown as "stop_desk" | "home");
      setValue("deliveryFee", 0);
    }
  };

  const deliveryFee = deliverySelection?.fee || 0;
  const subtotal = total;
  const coffretFee = calculateCoffretFee(boxColors.length);
  const orderTotal = subtotal + deliveryFee + coffretFee;

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
          notes: {
            giftNote: giftNote || undefined,
          },
          items: items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
          })),
          deliveryZoneId: data.deliveryZoneId,
          deliveryType: data.deliveryType,
          deliveryFee: data.deliveryFee,
          // Sourced from deliverySelection (not the RHF `data` object) —
          // these aren't independently validated form fields, they're the
          // real Yalidine center the customer picked in WilayaCommuneSelect
          // once deliveryType === "stop_desk". Required for stop-desk
          // parcel creation to actually find the right center — see
          // scripts/create-parcel.ts.
          stopdeskCenterId: deliverySelection?.stopdeskCenterId,
          stopdeskCommuneName: deliverySelection?.stopdeskCommuneName,
          packagingType: boxColors.length > 0 ? "luxury_coffret" : "standard",
          coffretFee: boxColors.length > 0 ? coffretFee : undefined,
          boxColors: boxColors.length > 0 ? boxColors : undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      setOrderComplete(true);
      setOrderId(result.data.id);
      dispatch(clearCart());
      dispatch(addToast({ message: t("checkout.success"), type: "success" }));
    } catch (error: any) {
      dispatch(
        addToast({
          message: error.message || t("common.error"),
          type: "error",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="mx-auto w-full px-[var(--space-md)] max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--color-white)] rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] p-8 text-center border border-[var(--color-border)]"
            data-testid="order-success"
          >
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 bg-[var(--color-bg-soft)]">
              <CheckCircleIcon className="w-8 h-8 text-[var(--color-text)]" />
            </div>
            <h1 className="font-display text-3xl text-[var(--color-text)] mb-4">
              {t("checkout.success")}
            </h1>
            <p className="text-[var(--color-text-secondary)] mb-2">
              {t("footer.tagline")}
            </p>
            {orderId && (
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                {t("admin.orders.orderId")}: {orderId.slice(0, 8)}
              </p>
            )}
            <Link href="/shop" className="cursor-pointer">
              <Button
                fullWidth
                className="!border-2 !border-[var(--color-text)] !bg-[var(--color-text)] !text-[var(--color-white)] hover:!bg-transparent hover:!text-[var(--color-text)] cursor-pointer transition-colors duration-[var(--duration-base)] ease-[var(--ease-luxury)]"
              >
                {t("cart.continueShopping")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="mx-auto w-full px-[var(--space-md)] max-w-lg text-center">
          <ShoppingBagIcon className="w-16 h-16 text-[var(--color-border)] mx-auto mb-6" />
          <h1 className="font-display text-3xl text-[var(--color-text)] mb-4">
            {t("cart.empty")}
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-8">
            {t("shop.subtitle")}
          </p>
          <Link href="/shop" className="cursor-pointer">
            <Button className="!border-2 !border-[var(--color-text)] !bg-[var(--color-text)] !text-[var(--color-white)] hover:!bg-transparent hover:!text-[var(--color-text)] cursor-pointer transition-colors duration-[var(--duration-base)] ease-[var(--ease-luxury)]">
              {t("home.hero.shopNow")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <section className="bg-[var(--color-bg-soft)] py-12">
        <div className="mx-auto w-full px-[var(--space-2xl)] max-w-[1440px]">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors duration-[var(--duration-base)] ease-[var(--ease-luxury)] mb-4 cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {t("cart.continueShopping")}
          </Link>
          <h1 className="font-display text-4xl sm:text-5xl text-[var(--color-text)]">
            {t("cart.title")}
          </h1>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto w-full px-[var(--space-2xl)] max-w-[1440px]">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Order Summary */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <h2 className="font-display text-2xl text-[var(--color-text)] mb-6">
                {t("cart.orderSummary")}
              </h2>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-4 bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border)]"
                  >
                    <ProductThumb
                      image={item.product.images?.[0]}
                      colorHex={item.product.colorHex}
                      name={item.product.name}
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[var(--color-text)] text-sm truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[var(--color-text-secondary)] text-xs mt-0.5">
                        {formatPrice(item.product.price)}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(qty) =>
                            dispatch(
                              updateQuantity({
                                productId: item.product.id,
                                quantity: qty,
                              }),
                            )
                          }
                        />
                        <button
                          onClick={() => dispatch(removeItem(item.product.id))}
                          className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors duration-[var(--duration-base)] ease-[var(--ease-luxury)] cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Box packaging selector — directly under the products list */}
              <BoxPackagingSelector
                boxColors={boxColors}
                maxBoxCount={maxBoxCount}
                itemCount={itemCount}
                onChange={(colors) => dispatch(setBoxColors(colors))}
                t={t}
              />
            </motion.div>

            {/* Right: Checkout Form */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-display text-2xl text-[var(--color-text)] mb-6">
                {t("checkout.title")}
              </h2>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                data-testid="checkout-form"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={t("checkout.firstName")}
                    placeholder={t("checkout.firstName")}
                    error={errors.firstName?.message}
                    {...register("firstName")}
                  />
                  <Input
                    label={t("checkout.lastName")}
                    placeholder={t("checkout.lastName")}
                    error={errors.lastName?.message}
                    {...register("lastName")}
                  />
                </div>

                <Input
                  label={t("checkout.phone")}
                  placeholder="0555 123 456"
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                <WilayaCommuneSelect
                  onChange={handleDeliveryChange}
                  error={
                    errors.deliveryZoneId?.message ||
                    errors.deliveryType?.message
                  }
                  t={t}
                />

                <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] p-6 border border-[var(--color-border)] mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[var(--color-text-secondary)]">
                      {t("common.subtotal")}
                    </span>
                    <span className="text-[var(--color-text)]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  {boxColors.length > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[var(--color-text-secondary)]">
                        {t("cart.packaging.fee") || "Coffret"}
                        {boxColors.length > 1 ? ` ×${boxColors.length}` : ""}
                      </span>
                      <span className="text-[var(--color-text)]">
                        {formatPrice(coffretFee)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[var(--color-text-secondary)]">
                      {t("common.delivery")}
                    </span>
                    <span className="text-[var(--color-text)]">
                      {deliveryFee > 0
                        ? formatPrice(deliveryFee)
                        : t("common.free")}
                    </span>
                  </div>
                  <div className="border-t border-[var(--color-border)] pt-4 flex justify-between items-center">
                    <span className="font-bold text-[var(--color-text)]">
                      {t("common.total")}
                    </span>
                    <span className="text-2xl font-extrabold text-[var(--color-text)]">
                      {formatPrice(orderTotal)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  disabled={!deliverySelection}
                  className="!border-2 !border-[var(--color-text)] !bg-[var(--color-text)] !text-[var(--color-white)] hover:!bg-transparent hover:!text-[var(--color-text)] disabled:!bg-[var(--color-bg-soft)] disabled:!border-[var(--color-border)] disabled:!text-[var(--color-text-secondary)] cursor-pointer transition-colors duration-[var(--duration-base)] ease-[var(--ease-luxury)]"
                  data-testid="place-order-button"
                >
                  {!deliverySelection
                    ? t("checkout.selectDelivery") || "Select delivery"
                    : t("checkout.placeOrder")}
                </Button>

                <p className="text-xs text-[var(--color-text-secondary)] text-center">
                  {t("footer.tagline")}
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
