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
            <div className="relative z-10 mx-5 md:mx-0 w-full max-w-md rounded-2xl bg-white dark:bg-[#111111] p-6 shadow-xl dark:border dark:border-[#222222]">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>

                {description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {description}
                    </p>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#333333] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] disabled:opacity-50"
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
