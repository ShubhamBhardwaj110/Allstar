"use client";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";

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
        <Star
          fill={added ? "#FACC15" : "none"}
          stroke="#FACC15"
          strokeWidth={1.5}
          size={24}
          className={isLoading ? "opacity-50" : ""}
        />
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
        <Trash2 size={20} className="mr-2" />
      ) : null}
      <span>{isLoading ? "Loading..." : label}</span>
    </button>
  );
};

export default WatchlistButton;