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
  Stepper,
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
  formatShippingQuote,
  getProvinceById,
  getProvinceFromPostalCode,
  isLocalPostalCode,
  type ArgentineProvinceId,
  type DeliveryMethod,
} from "@shared/index";

type CheckoutStep = "shipping" | "payment" | "review";

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

const initialFormData: CheckoutFormData = {
  name: "",
  email: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "Jujuy",
    postal_code: "",
    country: "AR",
  },
};

function validateShippingStep(
  formData: CheckoutFormData,
  deliveryMethod: DeliveryMethod,
  provinceId: ArgentineProvinceId,
  shippingQuote: ReturnType<typeof calculateShipping>,
): string | null {
  if (!formData.email.trim()) return "Ingresá tu email";
  if (!formData.name.trim()) return "Ingresá tu nombre";
  if (!formData.address.postal_code.trim()) return "Ingresá tu código postal";

  if (deliveryMethod === "shipping") {
    if (!formData.address.line1.trim()) return "Ingresá tu dirección";
    if (!formData.address.city.trim()) return "Ingresá tu ciudad";
    if (!provinceId) return "Seleccioná tu provincia";
    if (!shippingQuote.isValid) return shippingQuote.label;
  }

  return null;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartItems();
  const cartTotal = useCartTotal();
  const cartLoading = useCartIsLoading();

  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [provinceId, setProvinceId] = useState<ArgentineProvinceId>("mendoza");
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

  useEffect(() => {
    const postalCode = formData.address.postal_code.trim();
    if (!postalCode || provinceLockedByUser.current) return;

    const detected = getProvinceFromPostalCode(postalCode);
    if (detected) {
      setProvinceId(detected);
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, state: getProvinceById(detected).name },
      }));
    }
  }, [formData.address.postal_code]);

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

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

  const handleNext = () => {
    if (step === "shipping") {
      const validationError = validateShippingStep(
        formData,
        deliveryMethod,
        provinceId,
        shippingQuote,
      );
      if (validationError) {
        showToast({ type: "error", title: validationError });
        return;
      }
      setStep("payment");
    } else if (step === "payment") {
      setStep("review");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (step === "payment") setStep("shipping");
    else if (step === "review") setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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

  const steps = [
    { number: "01", label: "Envío", active: step === "shipping" },
    { number: "02", label: "Pago", active: step === "payment" },
    { number: "03", label: "Revisión", active: step === "review" },
  ];

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 pb-28 lg:pb-20">
        <div className="mb-16 mt-8 animate-fade-in">
          <div className="text-center mt-6">
            <BackButton
              label="Volver"
              showLabelOnMobile={true}
              page="checkout"
            />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-12">
            Finalizar compra
          </h1>
          <Stepper steps={steps} />
        </div>

        <PendingPaymentBanner className="mb-10" variant="checkout" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-12">
            {step === "shipping" && (
              <form
                onSubmit={(event) => event.preventDefault()}
                className="animate-fade-in space-y-8"
              >
                <FormSection title="Información de contacto">
                  <div className="space-y-6">
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
                  </div>
                </FormSection>

                <FormSection title="Código postal">
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
                </FormSection>

                {isLocal && (
                  <FormSection title="Forma de entrega (zona local)">
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
                          Gratis en CP 4512
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2">
                        <FloatingLabelInput
                          label="Dirección"
                          placeholder="Calle y número"
                          value={formData.address.line1}
                          onChange={(event) =>
                            handleInputChange(
                              "address.line1",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <FloatingLabelInput
                        label="Ciudad"
                        value={formData.address.city}
                        onChange={(event) =>
                          handleInputChange("address.city", event.target.value)
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
                    </div>
                  </FormSection>
                )}

                <section className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="px-6 py-3 border border-outline-variant hover:bg-surface-container transition-colors rounded-lg"
                  >
                    Volver al carrito
                  </button>
                  <PrimaryButton type="button" onClick={handleNext}>
                    Continuar al pago
                  </PrimaryButton>
                </section>
              </form>
            )}

            {step === "payment" && (
              <form
                onSubmit={(event) => event.preventDefault()}
                className="animate-fade-in space-y-8"
              >
                <FormSection title="Método de pago">
                  <div className="p-6 border border-primary rounded-xl bg-primary-container/10">
                    <h3 className="font-serif text-lg font-bold text-on-surface mb-2">
                      Transferencia vía GalioPay
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      Pagás por transferencia bancaria en una página segura de
                      GalioPay.
                      {isLocal && deliveryMethod === "pickup"
                        ? " Después del pago, retirás en nuestro punto de entrega."
                        : isLocal
                          ? " Envío local gratis en CP 4512."
                          : ""}
                    </p>
                  </div>
                </FormSection>

                <section className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border border-outline-variant hover:bg-surface-container transition-colors rounded-lg"
                  >
                    Volver
                  </button>
                  <PrimaryButton type="button" onClick={handleNext}>
                    Revisar pedido
                  </PrimaryButton>
                </section>
              </form>
            )}

            {step === "review" && (
              <form
                onSubmit={handleSubmit}
                className="animate-fade-in space-y-8"
              >
                <FormSection title="Resumen del pedido">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-outline-variant/30">
                      <span>Contacto</span>
                      <span className="text-right">
                        {formData.name}
                        <br />
                        {formData.email}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-outline-variant/30">
                      <span>Entrega</span>
                      <span className="text-right max-w-[60%]">
                        {deliveryMethod === "pickup"
                          ? `Retiro · ${PICKUP_POINT.address}`
                          : `${formData.address.line1}, ${formData.address.city}`}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-outline-variant/30">
                      <span>CP</span>
                      <span>{formData.address.postal_code}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-outline-variant/30">
                      <span>Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-outline-variant/30">
                      <span>Envío</span>
                      <span>{formatShippingQuote(shippingQuote)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </FormSection>

                <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/30">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(event) =>
                        setTermsAccepted(event.target.checked)
                      }
                      className="w-5 h-5 mt-0.5 rounded border-outline focus:ring-2 focus:ring-primary"
                      required
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

                <section className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border border-outline-variant hover:bg-surface-container transition-colors rounded-lg"
                  >
                    Volver
                  </button>
                  <PrimaryButton
                    type="submit"
                    disabled={submitStatus !== "idle" || !termsAccepted}
                  >
                    {submitStatus === "creating"
                      ? "Creando orden..."
                      : submitStatus === "redirecting"
                        ? "Redirigiendo a GalioPay..."
                        : "Confirmar y pagar con GalioPay"}
                  </PrimaryButton>
                </section>
              </form>
            )}
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
