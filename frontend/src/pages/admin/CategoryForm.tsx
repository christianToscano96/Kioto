import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useCategoriesStore } from "@/store/categories";
import type { Category } from "../../../../shared/src";
import { showToast } from "@/components/ui/Toast";
import { Check, X } from '@/components/icons';

export function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const categories = useCategoriesStore((state) => state.categories);
  const isLoading = useCategoriesStore((state) => state.isLoadingAdmin);
  const createCategory = useCategoriesStore((state) => state.createCategory);
  const updateCategory = useCategoriesStore((state) => state.updateCategory);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);

  const category = categories?.find((c: Category) => c._id === id);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load category data for editing
  useEffect(() => {
    if (isEdit && category) {
      setFormData({
        name: category.name || "",
        imageUrl: category.imageUrl || "",
      });
    }
  }, [isEdit, category]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEdit) {
        await updateCategory(id!, formData);
        showToast({ type: 'success', title: 'Categoría actualizada' });
      } else {
        await createCategory(formData);
        showToast({ type: 'success', title: 'Categoría creada' });
      }
      navigate("/admin/categories");
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      showToast({ type: 'error', title: 'Error al guardar categoría' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-on-surface">
          {isEdit ? "Editar Categoría" : "Nueva Categoría"}
        </h1>
        <Button variant="ghost" onClick={() => navigate("/admin/categories")}>
          <X />
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/40">
          <div className="space-y-4">
            <Input
              label="Nombre de la Categoría"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
              required
              placeholder="Ej: Camisas, Pantalones, Accesorios..."
            />
            
{/* Imagen de categoría */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">
                Imagen de Categoría (Opcional)
              </label>
              <ImageUpload
                label=""
                currentImage={formData.imageUrl}
                onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                onRemove={() => setFormData({ ...formData, imageUrl: "" })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            <Check />
            {isEdit ? "Actualizar Categoría" : "Crear Categoría"}
          </Button>
          <Button variant="ghost" onClick={() => navigate("/admin/categories")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}