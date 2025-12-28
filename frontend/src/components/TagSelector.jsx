import React from 'react';

const STATIC_TAGS = ["Photography", "Art", "History", "Design", "Architecture", "Music", "Literature", "Cinema"];

const TagSelector = ({ selectedTags, onChange }) => {
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) { // Require at least one
        onChange(selectedTags.filter(t => t !== tag));
      }
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {STATIC_TAGS.map(tag => (
        <button
          key={tag}
          type="button"
          onClick={() => toggleTag(tag)}
          className={`px-4 py-2 rounded-none text-xs uppercase tracking-widest border transition ${selectedTags.includes(tag)
              ? 'bg-museum-text text-white border-museum-text'
              : 'bg-white text-museum-muted border-museum-stone hover:border-museum-text hover:text-museum-text'
            }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

export default TagSelector;