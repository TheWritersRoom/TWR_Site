import { useEffect, useState } from "react";

export function useFreeSlots() {
  const [slots, setSlots] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/settings/free-slots")
      .then((r) => r.json())
      .then((d) => setSlots(typeof d.slots === "number" ? d.slots : null))
      .catch(() => setSlots(null));
  }, []);

  return slots;
}
