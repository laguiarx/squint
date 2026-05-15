import { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";
import { I } from "./Icons";

type Props = {
  query: string;
  caseSensitive: boolean;
  regex: boolean;
  total: number;
  current: number; // 0-based; -1 when no matches
  onQueryChange: (q: string) => void;
  onToggleCase: () => void;
  onToggleRegex: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
};

export type InFileSearchBarHandle = {
  focus: () => void;
};

export const InFileSearchBar = forwardRef<InFileSearchBarHandle, Props>(
  function InFileSearchBar(props, ref) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus() {
          inputRef.current?.focus();
          inputRef.current?.select();
        },
      }),
      [],
    );

    const label =
      props.query.length === 0
        ? "0 results"
        : props.total === 0
          ? "No results"
          : `${props.current + 1} of ${props.total}`;

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) props.onPrev();
        else props.onNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        props.onClose();
      }
    }

    return (
      <div className="infile-search" role="search">
        <span className="infile-icon">{I.search}</span>
        <input
          ref={inputRef}
          className="infile-input"
          type="text"
          placeholder="Find in file"
          value={props.query}
          onChange={(e) => props.onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className={cn("flag", props.caseSensitive && "is-on")}
          onClick={props.onToggleCase}
          title="Match case"
          type="button"
        >
          Aa
        </button>
        <button
          className={cn("flag", props.regex && "is-on")}
          onClick={props.onToggleRegex}
          title="Regex"
          type="button"
        >
          .*
        </button>
        <span className="infile-count mono dim">{label}</span>
        <div className="infile-nav">
          <button
            className="infile-iconbtn"
            onClick={props.onPrev}
            title="Previous match (⇧↵)"
            type="button"
            disabled={props.total === 0}
          >
            ↑
          </button>
          <button
            className="infile-iconbtn"
            onClick={props.onNext}
            title="Next match (↵)"
            type="button"
            disabled={props.total === 0}
          >
            ↓
          </button>
        </div>
        <button
          className="infile-iconbtn"
          onClick={props.onClose}
          title="Close (Esc)"
          type="button"
        >
          {I.x}
        </button>
      </div>
    );
  },
);
