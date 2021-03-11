import styles from "./App.module.css";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

const API_ENDPOINT = "https://hn.algolia.com/api/v1/search?query=";

const useSemiPersistentState = (key, initialState) => {
	const [value, setValue] = useState(localStorage.getItem(key) || initialState);

	useEffect(() => {
		localStorage.setItem(key, value);
	}, [value, key]);

	return [value, setValue];
};

const storiesReducer = (state, action) => {
	switch (action.type) {
		case "STORIES_FETCH_INIT":
			return {
				...state,
				isLoading: true,
				isError: false,
			};
		case "STORIES_FETCH_SUCCESS":
			return {
				...state,
				isLoading: false,
				isError: false,
				data: action.payload,
			};
		case "STORIES_FETCH_FAILURE":
			return {
				...state,
				isLoading: false,
				isError: true,
			};
		case "REMOVE_STORY":
			return {
				...state,
				data: state.data.filter((story) => action.payload.objectID !== story.objectID),
			};
		default:
			throw new Error();
	}
};

export default function App() {
	const [searchTerm, setSearchTerm] = useSemiPersistentState("search", "React");
	const [url, setUrl] = useState(`${API_ENDPOINT}${searchTerm}`);
	const [stories, dispatchStories] = useReducer(storiesReducer, {
		data: [],
		isLoading: false,
		isError: false,
	});

	const handleFetchStories = useCallback(async () => {
		dispatchStories({ type: "STORIES_FETCH_INIT" });
		try {
			await fetch(url)
				.then((response) => response.json())
				.then((result) => {
					dispatchStories({
						type: "STORIES_FETCH_SUCCESS",
						payload: result.hits,
					});
				});
		} catch {
			dispatchStories({ type: "STORIES_FETCH_FAILURE" });
		}
	}, [url]);

	useEffect(() => {
		handleFetchStories();
	}, [handleFetchStories]);

	const handleRemoveStory = (item) => {
		dispatchStories({
			type: "REMOVE_STORY",
			payload: item,
		});
	};

	const handleSearchInput = (event) => {
		setSearchTerm(event.target.value);
	};

	const handleSearchSubmit = (event) => {
		event.preventDefault();

		setUrl(`${API_ENDPOINT}${searchTerm}`);
	};

	return (
		<div className={styles.container}>
			<h1 className={styles.headlinePrimary}>My Hacker Stories</h1>

			<SearchForm
				searchTerm={searchTerm}
				onSearchInput={handleSearchInput}
				onSearchSubmit={handleSearchSubmit}
			/>

			{stories.isError && <p>Something went wrong ...</p>}

			{stories.isLoading ? (
				<p>Loading ...</p>
			) : (
				<List list={stories.data} onRemoveItem={handleRemoveStory} />
			)}
		</div>
	);
}

function List({ list, onRemoveItem }) {
	return list.map((item) => <Item key={item.objectID} onRemoveItem={onRemoveItem} item={item} />);
}

function Item({ onRemoveItem, item }) {
	const { title, url, author, num_comments, points } = item;
	return (
		<div className={styles.item}>
			<span style={{ width: "40%" }}>
				<a href={url}>{title}</a>
			</span>
			<span style={{ width: "30%" }}>{author}</span>
			<span style={{ width: "10%" }}>{num_comments}</span>
			<span style={{ width: "10%" }}>{points}</span>
			<span style={{ width: "10%" }}>
				<button
					type="button"
					className={`${styles.button} ${styles.button_small}`}
					onClick={() => onRemoveItem(item)}
				>
					Dismiss
				</button>
			</span>
		</div>
	);
}

function InputWithLabel({ id, value, type = "text", onInputChange, isFocused, children }) {
	const inputRef = useRef();
	useEffect(() => {
		if (isFocused && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isFocused]);
	return (
		<>
			<label htmlFor={id} className={styles.label}>
				{children}{" "}
			</label>
			<input
				ref={inputRef}
				className={styles.input}
				id={id}
				type={type}
				onChange={onInputChange}
				value={value}
				autoFocus={isFocused}
			/>
		</>
	);
}

function SearchForm({ searchTerm, onSearchInput, onSearchSubmit }) {
	return (
		<form className={styles.searchForm} onSubmit={onSearchSubmit}>
			<InputWithLabel id="search" value={searchTerm} isFocused onInputChange={onSearchInput}>
				<strong>Search:</strong>
			</InputWithLabel>
			<button
				type="submit"
				className={`${styles.button} ${styles.buttonLarge}`}
				disabled={!searchTerm}
			>
				Submit
			</button>
		</form>
	);
}
