"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useJsApiLoader } from "@react-google-maps/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

// Must be defined outside the component to avoid "LoadScript reloaded" warnings.
// Must match the libraries array in VenueMap.tsx.
const LIBRARIES: ("places")[] = ["places"];

type Prediction = {
  description: string;
  place_id: string;
};

type Props = { open: boolean; onClose: () => void };

export default function SearchModal({ open, onClose }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setPredictions([]);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !autocompleteService.current || query.trim().length < 2) {
      setPredictions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: "au" },
        types: ["(regions)"],
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(
            results.slice(0, 6).map((r) => ({ description: r.description, place_id: r.place_id }))
          );
        } else {
          setPredictions([]);
        }
      }
    );
  }, [query, isLoaded]);

  const selectLocation = (prediction: Prediction) => {
    const placesDiv = document.createElement("div");
    const service = new google.maps.places.PlacesService(placesDiv);
    service.getDetails(
      { placeId: prediction.place_id, fields: ["geometry"] },
      (place, status) => {
        const params = new URLSearchParams({ location: prediction.description });
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          params.set("lat", String(place.geometry.location.lat()));
          params.set("lng", String(place.geometry.location.lng()));
        }
        onClose();
        router.push(`/search?${params.toString()}`);
      }
    );
  };

  const handleFreeSearch = () => {
    if (predictions.length > 0) {
      selectLocation(predictions[0]);
    } else if (query.length > 2) {
      const params = new URLSearchParams({ location: query });
      onClose();
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Find a court in your area</DialogTitle>
          <DialogDescription>Enter your suburb or postcode and select a location</DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="e.g. Box Hill, 3128"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFreeSearch();
              }}
              className="pl-9 h-11"
            />
          </div>

          {predictions.length > 0 && (
            <div className="mt-2 rounded-lg border bg-popover overflow-hidden" style={{ animation: "slideDown 0.15s ease-out" }}>
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  onClick={() => selectLocation(prediction)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-accent"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {prediction.description}
                </button>
              ))}
            </div>
          )}

          {query.length > 3 && predictions.length === 0 && (
            <Button onClick={handleFreeSearch} className="mt-3" size="sm">
              <Search className="mr-2 h-3.5 w-3.5" />
              Search &ldquo;{query}&rdquo;
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
