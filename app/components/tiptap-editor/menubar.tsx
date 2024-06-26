export const TiptapMenuBar = ({ editor }) => {
	if (!editor) {
		return null
	}

	const MenuCSS =
		'bg-white rounded mx-0.5 my-1 py-[0.1rem] px-1 border border-black'

	const MenuCSSActive = 'bg-black text-white'

	return (
		<>
			<button
				onClick={() => editor.chain().focus().toggleBold().run()}
				className={`${
					editor.isActive('bold') ? `${MenuCSSActive}` : ''
				} ${MenuCSS}`}
			>
				bold
			</button>
			<button
				onClick={() => editor.chain().focus().toggleItalic().run()}
				className={`${
					editor.isActive('italic') ? `${MenuCSSActive}` : ''
				} ${MenuCSS}`}
			>
				italic
			</button>
			<button
				onClick={() => editor.chain().focus().toggleStrike().run()}
				className={`${
					editor.isActive('strike') ? `${MenuCSSActive}` : ''
				} ${MenuCSS}`}
			>
				strike
			</button>
			<button
				onClick={() => editor.chain().focus().toggleCode().run()}
				className={`${
					editor.isActive('code') ? `${MenuCSSActive}` : ''
				} ${MenuCSS}`}
			>
				code
			</button>
			<button
				onClick={() => editor.chain().focus().unsetAllMarks().run()}
				className={`${MenuCSS}`}
			>
				clear marks
			</button>
			{/* <button
        onClick={() => editor.chain().focus().clearNodes().run()}
        className={`${
          editor.isActive('clear nodes') ? `${MenuCSSActive}` : ''
        } ${MenuCSS}`}
      >
        clear nodes
      </button> */}
			<button
				onClick={() => editor.chain().focus().setParagraph().run()}
				className={`${
					editor.isActive('paragraph') ? `${MenuCSSActive}` : ''
				} ${MenuCSS}`}
			>
				paragraph
			</button>
			<button
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				className={`${
					editor.isActive('heading', { level: 1 }) ? `${MenuCSSActive}` : ''
				} ${MenuCSS}`}
			>
				h1
			</button>
			<button
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				className={`${
					editor.isActive('heading', { level: 2 }) ? `${MenuCSSActive}` : ''
				} ${MenuCSS}`}
			>
				h2
			</button>
			{/* <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
      >
        h3
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}
      >
        h4
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        className={editor.isActive('heading', { level: 5 }) ? 'is-active' : ''}
      >
        h5
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        className={editor.isActive('heading', { level: 6 }) ? 'is-active' : ''}
      >
        h6
      </button> */}
			{/* <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${
          editor.isActive('bulletList') ? `${MenuCSSActive}` : ''
        } ${MenuCSS}`}
      >
        bullet list
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${
          editor.isActive('orderedList') ? `${MenuCSSActive}` : ''
        } ${MenuCSS}`}
      >
        ordered list
      </button> */}
			{/* <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'is-active' : ''}
      >
        code block
      </button> */}
			{/* <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
      >
        blockquote
      </button> */}
			<button
				onClick={() => editor.chain().focus().setHorizontalRule().run()}
				className={`${MenuCSS}`}
			>
				horizontal rule
			</button>
			{/* <button onClick={() => editor.chain().focus().setHardBreak().run()}>
        hard break
      </button> */}
			<button
				onClick={() => editor.chain().focus().undo().run()}
				className={`${MenuCSS}`}
			>
				undo
			</button>
			<button
				onClick={() => editor.chain().focus().redo().run()}
				className={`${MenuCSS}`}
			>
				redo
			</button>
		</>
	)
}
