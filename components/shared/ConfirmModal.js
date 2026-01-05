'use client'

export default function ConfirmModal({
    open,
    title = 'Are you sure?',
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onClose,
    loading = false
}) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 mx-5 md:mx-0 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {title}
                </h3>

                {description && (
                    <p className="text-gray-600 mb-6">
                        {description}
                    </p>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? 'Processing…' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
