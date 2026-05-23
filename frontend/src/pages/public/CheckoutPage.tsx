import { X, Loader2 } from "@/components/icons";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCartItems,
  useCartTotal,
  useCartIsLoading,
  useCartStore,
} from "@/store/cart";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import {
  FormSection,
  FloatingLabelInput,
  FloatingLabelSelect,
  SecurityBadge,
  PrimaryButton,
} from "@/components/checkout/CheckoutFormComponents";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PendingPaymentBanner } from "@/components/checkout/PendingPaymentBanner";
import { api } from "@/lib/api";
import { showToast } from "@/components/ui/Toast";
import { BackButton } from "@/components/ui/BackButton";
import {
  ARGENTINE_PROVINCES,
  PICKUP_POINT,
  calculateShipping,
  formatShippingCost,
  formatShippingQuote,
  getLocalAddressDefaults,
  getProvinceById,
  getProvinceFromPostalCode,
  isLocalPostalCode,
  LOCAL_CITY,
  LOCAL_PROVINCE_NAME,
  type ArgentineProvinceId,
  type DeliveryMethod,
} from "@shared/index";

interface CheckoutFormData {
  name: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

const localDefaults = getLocalAddressDefaults();

const initialFormData: CheckoutFormData = {
  name: "",
  email: "",
  address: {
    line1: "",
    line2: "",
    city: localDefaults.city,
    state: localDefaults.state,
    postal_code: "",
    country: "AR",
  },
};

function validateCheckoutForm(
  formData: CheckoutFormData,
  deliveryMethod: DeliveryMethod,
  provinceId: ArgentineProvinceId,
  shippingQuote: ReturnType<typeof calculateShipping>,
  termsAccepted: boolean,
): string | null {
  if (!formData.email.trim()) return "Ingresá tu email";
  if (!formData.name.trim()) return "Ingresá tu nombre";
  if (!formData.address.postal_code.trim()) return "Ingresá tu código postal";
  if (!termsAccepted) return "Aceptá los términos y condiciones";

  if (deliveryMethod === "shipping") {
    if (!formData.address.line1.trim()) return "Ingresá tu dirección";
    if (!isLocalPostalCode(formData.address.postal_code)) {
      if (!formData.address.city.trim()) return "Ingresá tu ciudad";
      if (!provinceId) return "Seleccioná tu provincia";
    }
    if (!shippingQuote.isValid) return shippingQuote.label;
  } else if (!shippingQuote.isValid) {
    return shippingQuote.label;
  }

  return null;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartItems();
  const cartTotal = useCartTotal();
  const cartLoading = useCartIsLoading();

  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [provinceId, setProvinceId] = useState<ArgentineProvinceId>(
    localDefaults.provinceId,
  );
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("shipping");
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [storeTerms, setStoreTerms] = useState<string>("");
  const [showTerms, setShowTerms] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "creating" | "redirecting"
  >("idle");
  const provinceLockedByUser = useRef(false);

  useEffect(() => {
    const resetSubmitState = () => {
      setSubmitStatus((current) =>
        current === "redirecting" ? "idle" : current,
      );
    };

    window.addEventListener("pageshow", resetSubmitState);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        resetSubmitState();
      }
    });

    return () => {
      window.removeEventListener("pageshow", resetSubmitState);
    };
  }, []);

  const isLocal = isLocalPostalCode(formData.address.postal_code);
  const shippingQuote = useMemo(
    () =>
      calculateShipping(
        formData.address.postal_code,
        deliveryMethod,
        provinceId,
      ),
    [formData.address.postal_code, deliveryMethod, provinceId],
  );
  const shipping = shippingQuote.cost;
  const total = cartTotal + shipping;
  const payButtonLabel =
    submitStatus === "creating"
      ? "Creando orden..."
      : submitStatus === "redirecting"
        ? "Redirigiendo a GalioPay..."
        : `Pagar ${formatShippingCost(total)}`;

  useEffect(() => {
    if (!isLocal) return;

    setProvinceId(localDefaults.provinceId);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        city: localDefaults.city,
        state: localDefaults.state,
      },
    }));
  }, [isLocal]);

  useEffect(() => {
    const postalCode = formData.address.postal_code.trim();
    if (!postalCode || provinceLockedByUser.current || isLocal) return;

    const detected = getProvinceFromPostalCode(postalCode);
    if (detected) {
      setProvinceId(detected);
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, state: getProvinceById(detected).name },
      }));
    }
  }, [formData.address.postal_code, isLocal]);

  useEffect(() => {
    if (!isLocal && deliveryMethod === "pickup") {
      setDeliveryMethod("shipping");
    }
  }, [isLocal, deliveryMethod]);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => {
        if (res.data?.policies?.terms) {
          setStoreTerms(res.data.policies.terms);
        }
      })
      .catch(() => {});
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handlePostalCodeChange = (value: string) => {
    provinceLockedByUser.current = false;
    handleInputChange("address.postal_code", value);
  };

  const handleProvinceChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    provinceLockedByUser.current = true;
    const nextProvinceId = event.target.value as ArgentineProvinceId;
    setProvinceId(nextProvinceId);
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, state: getProvinceById(nextProvinceId).name },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateCheckoutForm(
      formData,
      deliveryMethod,
      provinceId,
      shippingQuote,
      termsAccepted,
    );
    if (validationError) {
      showToast({ type: "error", title: validationError });
      return;
    }

    setSubmitStatus("creating");
    setError(null);

    try {
      const response = await api.post("/checkout", {
        deliveryMethod,
        paymentMethod: "galio",
        shippingDetails: formData,
      });

      const data = response.data;

      if (response.status !== 200 || !data.success) {
        throw new Error(data.error || "Error al crear la orden");
      }

      showToast({ type: "success", title: "Orden creada correctamente" });

      if (typeof data.sessionId === "string") {
        useCartStore.getState().setSessionId(data.sessionId);
      }

      if (data.orderId) {
        sessionStorage.setItem("kioto:pending-order-id", String(data.orderId));
      }

      if (data.paymentUrl) {
        setSubmitStatus("redirecting");
        window.location.href = data.paymentUrl;
      } else {
        navigate(
          `/checkout/success?orderId=${data.orderId}&delivery=${deliveryMethod}`,
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Ocurrió un error";
      setError(errorMsg);
      showToast({ type: "error", title: errorMsg });
      setSubmitStatus("idle");
    }
  };

  if (cartLoading) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center py-16 px-4">
            <h1 className="text-3xl font-serif font-bold text-on-surface mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-on-surface-variant mb-8">
              Agregá artículos antes de finalizar la compra.
            </p>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="font-label uppercase tracking-widest px-8 py-3 bg-primary text-on-primary hover:bg-primary-container transition-colors rounded-lg"
            >
              Ver productos
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 pb-36 lg:pb-16">
        <div className="mb-10 mt-4 animate-fade-in">
          <BackButton label="Volver" showLabelOnMobile={true} page="checkout" />
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight mt-6">
            Finalizar compra
          </h1>
          <p className="mt-3 text-on-surface-variant text-sm md:text-base">
            Completá tus datos y pagá con GalioPay en un solo paso.
          </p>
        </div>

        <PendingPaymentBanner className="mb-8" variant="checkout" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="animate-fade-in space-y-8"
              id="checkout-form"
            >
              <FormSection title="Tus datos">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingLabelInput
                    label="Correo electrónico"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(event) =>
                      handleInputChange("email", event.target.value)
                    }
                  />
                  <FloatingLabelInput
                    label="Nombre completo"
                    value={formData.name}
                    onChange={(event) =>
                      handleInputChange("name", event.target.value)
                    }
                  />
                  <div className="md:col-span-2">
                    <FloatingLabelInput
                      label="Código postal"
                      placeholder="4512, Y4512 o 1406"
                      value={formData.address.postal_code}
                      onChange={(event) =>
                        handlePostalCodeChange(event.target.value)
                      }
                    />
                    {formData.address.postal_code && (
                      <p
                        className={`mt-3 text-sm ${shippingQuote.isValid ? "text-on-surface-variant" : "text-red-600"}`}
                      >
                        {shippingQuote.label} ·{" "}
                        {formatShippingQuote(shippingQuote)}
                      </p>
                    )}
                  </div>
                </div>
              </FormSection>

              {isLocal && (
                <FormSection title="Entrega en zona local">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("shipping")}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        deliveryMethod === "shipping"
                          ? "border-primary bg-primary-container/15 ring-1 ring-primary/20"
                          : "border-outline-variant/40 hover:border-outline-variant"
                      }`}
                    >
                      <p className="font-label text-xs uppercase tracking-wider mb-1">
                        Envío a domicilio
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        Gratis · {LOCAL_CITY}, {LOCAL_PROVINCE_NAME}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("pickup")}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        deliveryMethod === "pickup"
                          ? "border-primary bg-primary-container/15 ring-1 ring-primary/20"
                          : "border-outline-variant/40 hover:border-outline-variant"
                      }`}
                    >
                      <p className="font-label text-xs uppercase tracking-wider mb-1">
                        Retiro en punto
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {PICKUP_POINT.name}
                      </p>
                    </button>
                  </div>
                </FormSection>
              )}

              {deliveryMethod === "pickup" ? (
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container p-5 text-sm text-on-surface-variant space-y-1">
                  <p className="font-medium text-on-surface">
                    {PICKUP_POINT.name}
                  </p>
                  <p>{PICKUP_POINT.address}</p>
                  <p>{PICKUP_POINT.hours}</p>
                  <p className="text-primary pt-2">{PICKUP_POINT.notes}</p>
                </div>
              ) : (
                <FormSection title="Dirección de envío">
                  {isLocal && (
                    <p className="-mt-4 mb-6 text-sm text-on-surface-variant">
                      Zona detectada:{" "}
                      <span className="font-medium text-on-surface">
                        {LOCAL_CITY}, {LOCAL_PROVINCE_NAME}
                      </span>
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FloatingLabelInput
                        label="Dirección"
                        placeholder="Calle y número"
                        value={formData.address.line1}
                        onChange={(event) =>
                          handleInputChange("address.line1", event.target.value)
                        }
                      />
                    </div>
                    {!isLocal && (
                      <>
                        <FloatingLabelInput
                          label="Ciudad"
                          value={formData.address.city}
                          onChange={(event) =>
                            handleInputChange(
                              "address.city",
                              event.target.value,
                            )
                          }
                        />
                        <FloatingLabelSelect
                          label="Provincia"
                          value={provinceId}
                          onChange={handleProvinceChange}
                        >
                          {ARGENTINE_PROVINCES.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          ))}
                        </FloatingLabelSelect>
                      </>
                    )}
                  </div>
                </FormSection>
              )}

              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-4 text-sm text-on-surface-variant">
                <p className="font-medium text-on-surface mb-1">
                  Pago con GalioPay
                </p>
                <p>
                  Al confirmar, te redirigimos a una transferencia segura. No
                  necesitás elegir otro método.
                </p>
              </div>

              <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) =>
                      setTermsAccepted(event.target.checked)
                    }
                    className="w-5 h-5 mt-0.5 rounded border-outline focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface">
                    Acepto los{" "}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      términos y condiciones
                    </button>
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              <section className="hidden lg:flex pt-2 flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="px-6 py-3 border border-outline-variant hover:bg-surface-container transition-colors rounded-lg"
                >
                  Volver al carrito
                </button>
                <PrimaryButton
                  type="submit"
                  disabled={submitStatus !== "idle"}
                >
                  {payButtonLabel}
                </PrimaryButton>
              </section>
            </form>
          </div>

          <OrderSummary
            items={items}
            subtotal={cartTotal}
            shippingQuote={shippingQuote}
            deliveryMethod={deliveryMethod}
            total={total}
          />
        </div>

        <SecurityBadge message="Tu conexión está encriptada y tus datos son manejados con cuidado artesanal." />
      </main>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-outline-variant/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">
              Total
            </p>
            <p className="text-lg font-bold text-primary">
              {formatShippingCost(total)}
            </p>
          </div>
          <PrimaryButton
            type="submit"
            form="checkout-form"
            disabled={submitStatus !== "idle"}
            className="shrink-0"
          >
            {submitStatus === "idle" ? "Pagar" : "Procesando..."}
          </PrimaryButton>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Términos y condiciones</h2>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="text-on-surface hover:text-primary"
              >
                <X size={20} />
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-on-surface">
              {storeTerms ? (
                <p className="whitespace-pre-wrap">{storeTerms}</p>
              ) : (
                <p>Términos y condiciones no configurados.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
