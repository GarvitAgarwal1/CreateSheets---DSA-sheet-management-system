function AddTopicForm({ title, onTitleChange, onAdd }) {
  return (
    <div className="add-topic-form">
      <input
        value={title}
        onChange={onTitleChange}
        onKeyDown={(event) => event.key === "Enter" && onAdd()}
        placeholder="Add a new topic..."
        className="add-topic-input"
      />
      <button
        onClick={onAdd}
        disabled={!title?.trim()}
        className="add-topic-btn"
        aria-label="Add topic"
      >
        +
      </button>
    </div>
  );
}

export default AddTopicForm;
