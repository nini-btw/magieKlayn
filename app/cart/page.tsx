"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
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
} from "lucide-react";

// Product image mapping
const getProductImage = (slug: string): string => {
  const imageMap: Record<string, string> = {
    chocoShips: "/images/chocoShips.png",
    mm: "/images/mm.png",
    pistash: "/images/pistash.png",
    viola: "/images/viola.png",
    peanut: "/images/peanut.png",
    ben10: "/images/ben10.png",
    lotus: "/images/lotus.png",
    strawbery: "/images/strawbery.png",
    bueno: "/images/bueno.png",
    kinder: "/images/kinder.png",
    tiramisu: "/images/tiramisu.png",
  };
  return imageMap[slug] || "/images/bueno.png";
};
import { Button } from "@/presentation/components/ui/Button";
import { Input, Textarea } from "@/presentation/components/ui/Input";
import { QuantityStepper } from "@/presentation/components/ui/QuantityStepper";
import {
  selectCartItems,
  selectCartTotal,
  selectCanCheckout,
  selectCookiesNeeded,
  selectCartProgress,
  removeItem,
  updateQuantity,
  clearCart,
  setCookingNote,
  setGiftNote,
  selectCookingNote,
  selectGiftNote,
} from "@/presentation/store/cart/cart.slice";
import { addToast } from "@/presentation/store/ui/ui.slice";
import { formatPrice } from "@/presentation/lib/utils";
import { fadeInUp } from "@/presentation/lib/animations";
import { useTranslations } from 'next-intl';
import { WilayaCommuneSelect } from "@/presentation/components/features/WilayaCommuneSelect";
import type { DeliverySelection } from "@/domain/entities/delivery";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(10, "Complete address required"),
  deliveryZoneId: z.string().uuid("Delivery zone is required"),
  deliveryType: z.enum(["stop_desk", "home"]),
  deliveryFee: z.number().min(0, "Delivery fee is required"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const t = useTranslations();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const canCheckout = useSelector(selectCanCheckout);
  const cookiesNeeded = useSelector(selectCookiesNeeded);
  const progress = useSelector(selectCartProgress);
  const cookingNote = useSelector(selectCookingNote);
  const giftNote = useSelector(selectGiftNote);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [orderComplete, setOrderComplete] = React.useState(false);
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const [deliverySelection, setDeliverySelection] = React.useState<DeliverySelection | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  // Update form values when delivery selection changes
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

  // Calculate totals
  const deliveryFee = deliverySelection?.fee || 0;
  const subtotal = total;
  const orderTotal = subtotal + deliveryFee;

  const onSubmit = async (data: CheckoutFormData) => {
    if (!canCheckout) {
      dispatch(
        addToast({
          message: `${t("build.completeSelection")} (${cookiesNeeded})`,
          type: "error",
        })
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order via API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName: data.fullName,
            phone: data.phone,
            address: data.address,
          },
          notes: {
            cookingNote: cookingNote || undefined,
            giftNote: giftNote || undefined,
          },
          items: items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
          })),
          deliveryZoneId: data.deliveryZoneId,
          deliveryType: data.deliveryType,
          deliveryFee: data.deliveryFee,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      setOrderComplete(true);
      setOrderId(result.data.id);
      dispatch(clearCart());
      dispatch(
        addToast({
          message: t("checkout.success"),
          type: "success",
        })
      );
    } catch (error: any) {
      dispatch(
        addToast({
          message: error.message || t("common.error"),
          type: "error",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(44,24,16,0.16)] p-8 text-center"
            data-testid="order-success"
          >
            <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="font-display text-3xl text-brown-900 mb-4">
              {t("checkout.success")}
            </h1>
            <p className="text-brown-700 mb-2">
              {t("footer.tagline")}
            </p>
            {orderId && (
              <p className="text-sm text-brown-400 mb-6">
                {t("admin.orders.orderId")}: {orderId.slice(0, 8)}
              </p>
            )}
            <Link href="/shop" className="cursor-pointer">
              <Button fullWidth className="cursor-pointer">{t("cart.continueShopping")}</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-12 max-w-lg text-center">
          <ShoppingBagIcon className="w-20 h-20 text-brown-100 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-brown-900 mb-4">
            {t("cart.empty")}
          </h1>
          <p className="text-brown-400 mb-8">
            {t("shop.subtitle")}
          </p>
          <Link href="/shop" className="cursor-pointer">
            <Button className="cursor-pointer">{t("home.hero.shopNow")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-sand/30 py-12">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-12 max-w-[1400px]">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-brown-400 hover:text-brown-700 transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {t("cart.continueShopping")}
          </Link>
          <h1 className="font-display text-4xl sm:text-5xl text-brown-900">
            {t("cart.title")}
          </h1>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-12 max-w-[1400px]">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Order Summary */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <h2 className="font-display text-2xl text-brown-900 mb-6">
                {t("cart.orderSummary")}
              </h2>

              {!canCheckout && (
                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 mb-6">
                  <p data-testid="cookies-needed" className="text-brown-700 text-sm font-medium text-center">
                    {t("build.completeSelection")}: {cookiesNeeded} 🍪
                  </p>
                  <div className="mt-2 h-2 bg-pink-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-4 bg-white rounded-2xl border border-brown-100"
                  >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-pink-50">
                      <Image
                        src={getProductImage(item.product.slug)}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-brown-900 text-sm truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-brown-400 text-xs mt-0.5">
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
                              })
                            )
                          }
                        />
                        <button
                          onClick={() => dispatch(removeItem(item.product.id))}
                          className="p-2 text-brown-400 hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <Textarea
                  label={t("checkout.cookingNote")}
                  placeholder={t("checkout.cookingNotePlaceholder")}
                  value={cookingNote || ""}
                  onChange={(e) => dispatch(setCookingNote(e.target.value))}
                  helperText=""
                />

                <Textarea
                  label={t("checkout.giftNote")}
                  placeholder={t("checkout.giftNotePlaceholder")}
                  value={giftNote || ""}
                  onChange={(e) => dispatch(setGiftNote(e.target.value))}
                  helperText=""
                />
              </div>
            </motion.div>

            {/* Right: Checkout Form */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-display text-2xl text-brown-900 mb-6">
                {t("checkout.title")}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="checkout-form">
                <Input
                  label={t("checkout.fullName")}
                  placeholder={t("checkout.fullName")}
                  error={errors.fullName?.message}
                  {...register("fullName")}
                />

                <Input
                  label={t("checkout.phone")}
                  placeholder="+213 555 123 456"
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                <Textarea
                  label={t("checkout.address")}
                  placeholder={t("checkout.address")}
                  error={errors.address?.message}
                  {...register("address")}
                />

                {/* Delivery Selection */}
                <WilayaCommuneSelect
                  onChange={handleDeliveryChange}
                  error={errors.deliveryZoneId?.message || errors.deliveryType?.message}
                  t={t}
                />

                <div className="bg-white rounded-2xl p-6 border border-brown-100 mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-brown-700">{t("common.subtotal")}</span>
                    <span className="text-brown-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-brown-700">{t("common.delivery")}</span>
                    <span className={deliveryFee > 0 ? "text-brown-900" : "text-green-600"}>
                      {deliveryFee > 0 ? formatPrice(deliveryFee) : t("common.free")}
                    </span>
                  </div>
                  <div className="border-t border-brown-100 pt-4 flex justify-between items-center">
                    <span className="font-bold text-brown-900">{t("common.total")}</span>
                    <span className="text-2xl font-extrabold text-brown-900">
                      {formatPrice(orderTotal)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  disabled={!canCheckout || !deliverySelection}
                  className="cursor-pointer"
                  data-testid="place-order-button"
                >
                  {!canCheckout 
                    ? `${t("build.completeSelection")} (${cookiesNeeded})`
                    : !deliverySelection
                    ? t("checkout.selectDelivery") || "Select delivery"
                    : t("checkout.placeOrder")}
                </Button>

                <p className="text-xs text-brown-400 text-center">
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
