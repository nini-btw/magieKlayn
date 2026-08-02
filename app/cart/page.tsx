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
  setBoxColor,
  selectBoxColor,
  selectIsBoxEligible,
  selectTotalItemCount,
  type BoxColor,
} from "@/presentation/store/cart/cart.slice";
import { addToast } from "@/presentation/store/ui/ui.slice";
import { formatPrice } from "@/presentation/lib/utils";
import { fadeInUp } from "@/presentation/lib/animations";
import { useTranslations } from "next-intl";
import { WilayaCommuneSelect } from "@/presentation/components/features/WilayaCommuneSelect";
import type { DeliverySelection } from "@/domain/entities/delivery";
import { MAX_BOX_CAPACITY } from "@/domain/rules/cart.rules";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
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
  deliveryType: z.enum(["stop_desk", "home"]),
  deliveryFee: z.number().min(0, "Delivery fee is required"),
});
type CheckoutFormData = z.infer<typeof checkoutSchema>;

// TODO: replace with the real coffret fee (or source from config/product data)
const COFFRET_FEE = 800;

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

/**
 * Box packaging selector — shown under the products list.
 * Lets the customer opt into a gift box (white or black), disabled
 * automatically when the cart holds more than MAX_BOX_CAPACITY bottles.
 * A selected box can be cleared via the small remove (×) icon on its card.
 */
const BoxPackagingSelector: React.FC<{
  boxColor: BoxColor | null;
  isEligible: boolean;
  itemCount: number;
  onSelect: (color: BoxColor | null) => void;
  t: ReturnType<typeof useTranslations>;
}> = ({ boxColor, isEligible, itemCount, onSelect, t }) => {
  // Backdrop behind each box swatch — darker neutral behind the white box
  // so its edges read clearly; a soft warm tint behind the black box.
  const CARD_BG: Record<BoxColor, string> = {
    white: "#eeeeee",
    black: "#ffffff",
  };

  return (
    <div className="mt-4 p-5 bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 mb-1">
        <PackageIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
        <h3 className="font-bold text-[var(--color-text)] text-sm">
          {t("cart.packaging.title") || "Coffret cadeau (optionnel)"}
        </h3>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] mb-4">
        {t("cart.packaging.capacityNote") ||
          `Le coffret peut contenir jusqu'à ${MAX_BOX_CAPACITY} flacons maximum.`}
      </p>

      {!isEligible && (
        <p className="text-xs text-amber-600 mb-3">
          {t("cart.packaging.notEligible") ||
            `Le coffret n'est disponible que pour ${MAX_BOX_CAPACITY} flacons ou moins (vous en avez ${itemCount}).`}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["white", "black"] as const).map((color) => {
          const isSelected = boxColor === color;
          return (
            <button
              key={color}
              type="button"
              disabled={!isEligible}
              onClick={() => onSelect(isSelected ? null : color)}
              className={`group relative flex flex-col items-center justify-center gap-2 h-60 px-2 rounded-[var(--radius-main)] border-2 overflow-hidden transition-all duration-[var(--duration-base)] ease-[var(--ease-luxury)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isSelected
                  ? "border-[var(--color-text)] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)] scale-[1.02]"
                  : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_-8px_rgba(0,0,0,0.18)]"
              }`}
              style={{ background: CARD_BG[color] }}
            >
              {/* Remove icon — only visible on the selected card */}
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(null);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--color-text)] text-[var(--color-white)] flex items-center justify-center cursor-pointer z-10"
                    aria-label={
                      t("cart.packaging.remove") || "Retirer le coffret"
                    }
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Selected check badge, bottom-left */}
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

              <div className="relative w-48 h-40 transition-transform duration-[var(--duration-base)] ease-[var(--ease-luxury)] group-hover:scale-105">
                <Image
                  src={BOX_IMAGES[color]}
                  alt={
                    color === "white"
                      ? t("cart.packaging.white") || "Coffret blanc"
                      : t("cart.packaging.black") || "Coffret noir"
                  }
                  fill
                  className="object-contain scale-180 sm:scale-170 drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]"
                />
              </div>
              <span className="text-xs font-medium text-[var(--color-text)] capitalize tracking-wide">
                {color === "white"
                  ? t("cart.packaging.white") || "Blanc"
                  : t("cart.packaging.black") || "Noir"}
              </span>
            </button>
          );
        })}
      </div>

      {boxColor && (
        <p className="text-xs text-[var(--color-text-secondary)] text-center mt-3">
          {t("cart.packaging.selectedNote") ||
            "Cliquez sur le × pour retirer le coffret."}
        </p>
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
  const boxColor = useSelector(selectBoxColor);
  const isBoxEligible = useSelector(selectIsBoxEligible);
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
  const coffretFee = boxColor ? COFFRET_FEE : 0;
  const orderTotal = subtotal + deliveryFee + coffretFee;

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName: data.fullName,
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
          packagingType: boxColor ? "luxury_coffret" : "standard",
          coffretFee: boxColor ? COFFRET_FEE : undefined,
          boxColor: boxColor ?? undefined,
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
                boxColor={boxColor}
                isEligible={isBoxEligible}
                itemCount={itemCount}
                onSelect={(color) => dispatch(setBoxColor(color))}
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
                <Input
                  label={t("checkout.fullName")}
                  placeholder={t("checkout.fullName")}
                  error={errors.fullName?.message}
                  {...register("fullName")}
                />

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
                  {boxColor && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[var(--color-text-secondary)]">
                        {t("cart.packaging.fee") || "Coffret"}
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
