"use client";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

// WatchlistButton component with API integration
// Handles adding/removing stocks from user's watchlist via API routes
// Shows loading state during API calls and displays toast notifications

const WatchlistButton = ({
  symbol,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isLoading, setIsLoading] = useState(false);

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const handleClick = async () => {
    const next = !added;
    setIsLoading(true);

    try {
      if (next) {
        // Adding to watchlist
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbol: symbol.toUpperCase(),
            company: symbol, // Using symbol as company name (can be improved with real company name)
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 409) {
            toast.info("Already in watchlist", {
              description: `${symbol} is already in your watchlist`,
            });
            setAdded(true);
          } else {
            throw new Error(data.error || "Failed to add to watchlist");
          }
        } else {
          toast.success("Added to watchlist", {
            description: `${symbol} has been added to your watchlist`,
          });
          setAdded(true);
        }
      } else {
        // Removing from watchlist
        const response = await fetch(`/api/watchlist/${symbol.toUpperCase()}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            toast.info("Not in watchlist", {
              description: `${symbol} is not in your watchlist`,
            });
            setAdded(false);
          } else {
            throw new Error(data.error || "Failed to remove from watchlist");
          }
        } else {
          toast.success("Removed from watchlist", {
            description: `${symbol} has been removed from your watchlist`,
          });
          setAdded(false);
        }
      }

      // Call optional callback for parent component updates
      onWatchlistChange?.(symbol, next);
    } catch (error) {
      // Revert state on error
      setAdded(!next);
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to update watchlist",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (type === "icon") {
    return (
      <button
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
        disabled={isLoading}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={added ? "#FACC15" : "none"}
          stroke="#FACC15"
          strokeWidth="1.5"
          className={`watchlist-star ${isLoading ? "opacity-50" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      className={`watchlist-btn ${added ? "watchlist-remove" : ""} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {showTrashIcon && added ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
        </svg>
      ) : null}
      <span>{isLoading ? "Loading..." : label}</span>
    </button>
  );
};

export default WatchlistButton;