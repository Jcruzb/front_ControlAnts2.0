import api from "./api";

/**
 * Service de Gastos fijos (RecurringPayment)
 * Usa api.js (axios centralizado con CSRF, interceptors, etc.)
 * Este archivo NO añade lógica de negocio, solo encapsula endpoints.
 */

const BASE_URL = "/recurring-payments/";

const recurringPaymentsService = {
    /**
     * Obtener todos los gastos fijos
     * GET /api/recurring-payments/
     */
    getAll() {
        return api.get(BASE_URL);
    },

    /**
     * Crear un nuevo gasto fijo
     * POST /api/recurring-payments/
     */
    create(data) {
        return api.post(BASE_URL, data);
    },

    /**
     * Actualizar un gasto fijo existente
     * PUT /api/recurring-payments/:id/
     */
    update(id, data) {
        return api.put(`${BASE_URL}${id}/`, data);
    },

    /**
     * Desactivar (soft delete) un gasto fijo
     * DELETE /api/recurring-payments/:id/
     */
    deactivate(id) {
        return api.delete(`${BASE_URL}${id}/`);
    },

    reactivate(id) {
        return api.post(`/recurring-payments/${id}/reactivate/`);
    }

};

export default recurringPaymentsService;
