import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import axios from 'axios';
import 'highlight.js/styles/atom-one-dark.css';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Terminal,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  X,
  Check,
  Trash2
} from 'lucide-react';

// Initialize syntax highlighters
const lowlight = createLowlight(all);

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Share your interview questions, rounds, DSA problems, tips, and overall experience...'
}) {
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Custom Link Modal States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Replaced by CodeBlockLowlight
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline font-medium hover:text-blue-600 cursor-pointer transition-colors',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-h-96 mx-auto my-4 border border-gray-400 shadow-sm object-contain'
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-lg p-4 my-3 font-mono text-xs bg-gray-950 text-gray-100 overflow-x-auto border border-gray-800'
        }
      })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none min-h-[280px] p-4 md:p-6 text-gray-1000 focus:outline-none custom-scrollbar text-sm leading-relaxed'
      }
    }
  });

  if (!editor) {
    return null;
  }

  // Open custom link modal
  const openLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    setLinkUrl(previousUrl);
    setLinkText(selectedText || '');
    setShowLinkModal(true);
  };

  // Submit custom link modal
  const handleSaveLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      // If empty URL, remove link
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setShowLinkModal(false);
      return;
    }

    let finalUrl = linkUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('mailto:')) {
      finalUrl = `https://${finalUrl}`;
    }

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection && linkText.trim()) {
      // Insert text with link
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: linkText.trim(),
          marks: [{ type: 'link', attrs: { href: finalUrl } }]
        })
        .run();
    } else {
      // Apply link mark to current selection
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Upload image to Cloudinary & insert at cursor
  const handleInlineImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.url) {
        editor.chain().focus().setImage({ src: res.data.url, alt: file.name }).run();
      }
    } catch (err) {
      console.error('Error uploading inline image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative border border-gray-400 rounded-xl bg-background-100 shadow-2xs focus-within:ring-1 focus-within:ring-gray-1000 focus-within:border-gray-1000 transition-all">
      {/* Sticky Editor Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-1 p-2 bg-background-200/95 backdrop-blur-md border-b border-gray-400 rounded-t-xl text-gray-700 select-none shadow-2xs">
        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-gray-400 mx-1" />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('underline') ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-gray-400 mx-1" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('blockquote') ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-gray-400 mx-1" />

        {/* Code & Terminal */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('code') ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('codeBlock') ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Code Block / Syntax Highlighting"
        >
          <Terminal className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-gray-400 mx-1" />

        {/* Custom Links & Images */}
        <button
          type="button"
          onClick={openLinkModal}
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors ${
            editor.isActive('link') ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs' : ''
          }`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <label
          className={`p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 cursor-pointer transition-colors flex items-center ${
            uploadingImage ? 'opacity-50 pointer-events-none' : ''
          }`}
          title="Insert Inline Image Between Paragraphs"
        >
          {uploadingImage ? (
            <div className="w-4 h-4 border-2 border-gray-1000 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleInlineImageUpload}
          />
        </label>

        {/* History */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-md hover:bg-background-100 hover:text-gray-1000 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <EditorContent editor={editor} />

      {/* Word and Character Count Footer */}
      <div className="px-4 py-2 bg-background-200/60 border-t border-gray-400 rounded-b-xl flex justify-between items-center text-xs text-gray-600">
        <span>Tip: Use Markdown shortcuts (e.g. # for H1, ``` for code, &gt; for quote)</span>
        <span className="font-mono">
          {editor.getText().length} / 50,000 chars
        </span>
      </div>

      {/* Custom Link Insertion Modal */}
      {showLinkModal && (
        <div
          onClick={() => setShowLinkModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-background-100 border border-gray-400 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-gray-1000"
          >
            <div className="flex items-center justify-between border-b border-gray-400 pb-3">
              <h3 className="font-semibold text-sm text-gray-1000 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> {editor.isActive('link') ? 'Edit Link' : 'Insert Link'}
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              {/* Optional Link Text if no selection */}
              <div>
                <label className="block text-xs font-medium text-gray-1000 mb-1.5">
                  Link Text (Optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. LeetCode Problem 42"
                  className="w-full px-3 py-2 rounded-md border border-gray-400 bg-background-200 text-gray-1000 text-xs focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 transition-colors placeholder:text-gray-500"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-medium text-gray-1000 mb-1.5">
                  Web Address (URL) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://leetcode.com/problems/..."
                  className="w-full px-3 py-2 rounded-md border border-gray-400 bg-background-200 text-gray-1000 text-xs focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 transition-colors font-mono placeholder:text-gray-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                {editor.isActive('link') ? (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors cursor-pointer border border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Link
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-3.5 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Link
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
