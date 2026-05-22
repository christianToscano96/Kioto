import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCategoriesStore } from "@/store/categories";
import { showToast } from "@/components/ui/Toast";
import { Plus, Edit2, Trash2 } from '@/components/icons';

export function CategoriesList() {
  const categories = useCategoriesStore((state) => state.categories);
  const isLoading = useCategoriesStore((state) => state.isLoadingAdmin);
  const error = useCategoriesStore((state) => state.error);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);
  const deleteCategory = useCategoriesStore((state) => state.deleteCategory);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
      try {
        await deleteCategory(id);
        showToast({ type: 'success', title: 'Categoría eliminada' });
      } catch (error) {
        showToast({ type: 'error', title: 'Error al eliminar categoría' });
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-terracota-50 text-terracota-700 rounded-lg">
        Error al cargar categorías. Por favor, intenta de nuevo.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <PageHeader
          title="Categorías"
          description="Organiza el catálogo por colecciones y tipos de producto."
          eyebrow="Panel de Administración"
          className="mb-0"
        />
        <Link to="/admin/categories/new">
          <Button>
            <Plus />
            Nueva Categoría
          </Button>
        </Link>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 overflow-hidden">
        <table className="w-full">
<thead className="bg-surface-container">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                   Imagen
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                   Nombre
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                   Slug
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                   Acciones
                 </th>
               </tr>
             </thead>
<tbody className="divide-y divide-outline-variant/40">
             {categories.map((category) => (
               <tr key={category._id} className="hover:bg-surface-container-low">
                 <td className="px-6 py-4">
                   {category.imageUrl ? (
                     <img
                       src={category.imageUrl}
                       alt={category.name}
                       className="h-10 w-10 object-cover rounded"
                       onError={(e) => {
                         (e.target as HTMLImageElement).style.display = 'none';
                       }}
                     />
                   ) : (
                     <div className="h-10 w-10 bg-surface-container rounded flex items-center justify-center text-on-surface-variant text-xs">
                       Sin img
                     </div>
                   )}
                 </td>
                 <td className="px-6 py-4 font-medium text-on-surface">
                   {category.name}
                 </td>
                 <td className="px-6 py-4 text-on-surface-variant">
                   /{category.slug}
                 </td>
                 <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <Link to={`/admin/categories/${category._id}/edit`}>
                       <Button variant="ghost" size="sm">
                          <Edit2 />
                       </Button>
                     </Link>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleDelete(category._id)}
                     >
                        <Trash2 />
                     </Button>
                   </div>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>

        {categories.length === 0 && (
          <div className="p-8 text-center text-on-surface-variant">
            <p className="mb-4">No hay categorías. Crea tu primera categoría.</p>
            <Link to="/admin/categories/new">
              <Button>Crear primera categoría</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}