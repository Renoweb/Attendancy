'use client'
import { useEffect } from 'react'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, List, Link as LinkIcon } from 'lucide-react'

export default function RichTextEditor({ value, onChange, readOnly, placeholder }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ link: false }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline',
                    target: '_blank',
                    rel: 'noopener noreferrer'
                },
            }),
        ],
        content: value,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            if (!readOnly && typeof onChange === 'function') {
                onChange(editor.getHTML())
            }
        },
        editorProps: {
            attributes: {
                class: 'quill-content focus:outline-none min-h-[100px] p-3 text-gray-800 dark:text-gray-100',
            },
        },
    })

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value ?? '', { emitUpdate: false })
        }
    }, [value, editor])

    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly, false)
        }
    }, [readOnly, editor])

    if (!editor) {
        return <div className="min-h-[100px] p-3 text-gray-500">Loading editor...</div>
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href
        let url = window.prompt('URL', previousUrl)

        if (url === null) {
            return
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        // Auto prepend https if no protocol exists
        if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:')) {
            url = `https://${url}`
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    return (
        <div className={`flex flex-col ${readOnly ? '' : 'rounded-lg overflow-hidden border border-gray-300 dark:border-[#333333] bg-white/50 dark:bg-[#0a0a0a]'}`}>
            {!readOnly && (
                <div className="flex gap-2 p-2 border-b border-gray-300 dark:border-[#333333] bg-gray-50 dark:bg-[#111111]">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-1.5 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                        title="Bold"
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-1.5 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                        title="Italic"
                    >
                        <Italic size={16} />
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-1.5 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                        title="Bullet List"
                    >
                        <List size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={setLink}
                        className={`p-1.5 rounded-md transition-colors ${editor.isActive('link') ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                        title="Link"
                    >
                        <LinkIcon size={16} />
                    </button>
                </div>
            )}
            <EditorContent editor={editor} className="flex-1 overflow-y-auto max-h-[300px]" />
        </div>
    )
}
