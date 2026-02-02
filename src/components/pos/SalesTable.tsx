/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { CartModel } from "../../types/cart";
import { useNavigate, useParams } from "react-router-dom";

interface SalesTableProps {
  carts: CartModel[];
}

const useSalesNavigation = () => {
  const navigate = useNavigate();
  const { businessId } = useParams<{ businessId: string }>();
  return {
    goToDetails: (cart: CartModel) => {
      if (!cart.id) return;
      navigate(`/pos/${businessId}/sales/${cart.id}`, { state: { cart } });
    },
  };
};

const monthName = (month: number) =>
  [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][month] || "";

const timeAgo = (date?: Date) => {
  if (!date) return "N/A";
  const d = new Date(date).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - d) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

const SalesTableMobile: React.FC<SalesTableProps> = ({ carts }) => {
  const { goToDetails } = useSalesNavigation();
  return (
    <div className="w-full">
      <ul className="divide-y divide-border">
        {carts.map((cart) => (
          <li key={cart.id}>
            <button
              onClick={() => goToDetails(cart)}
              className="w-full flex items-center justify-between px-4 py-3 active:bg-accent/50 hover:bg-accent/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {cart.hiveUserName ? (
                    <img
                      className="w-full h-full object-cover"
                      src={`https://images.hive.blog/u/${cart.hiveUserName}/avatar`}
                      alt={cart.hiveUserName}
                    />
                  ) : (
                    <span className="text-sm">👤</span>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-sm font-medium truncate max-w-[52vw]">
                    {cart.hiveUserName || "Guest"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {timeAgo(cart.createdAt)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-[52vw] mt-1">
                    {cart.items
                      .map(
                        (i) =>
                          `${i.productName}${
                            i.productQty ? " " + i.productQty : ""
                          }${
                            i.productQtyType ? ` (${i.productQtyType})` : ""
                          }`
                      )
                      .join(", ")}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-primary tabular-nums">
                ${cart.overAllTotal.toFixed(2)}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SalesTableDesktop: React.FC<SalesTableProps> = ({ carts }) => {
  const { goToDetails } = useSalesNavigation();
  return (
    <div className="w-full">
      <div
        className="px-4 py-2 text-sm font-bold grid"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 3fr" }}
      >
        <div>Consumer</div>
        <div>When</div>
        <div>Invoice Value</div>
        <div>Details</div>
      </div>
      <div className="border-t border-border" />
      <ul className="divide-y divide-border">
        {carts.map((cart) => (
          <li key={cart.id}>
            <button
              onClick={() => goToDetails(cart)}
              className="w-full px-4 py-3 hover:bg-accent/40 grid items-center text-left"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 3fr" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {cart.hiveUserName ? (
                    <img
                      className="w-full h-full object-cover"
                      src={`https://images.hive.blog/u/${cart.hiveUserName}/avatar`}
                      alt={cart.hiveUserName}
                    />
                  ) : (
                    <span className="text-xs">👤</span>
                  )}
                </div>
                <div className="truncate text-sm">
                  {cart.hiveUserName || "Guest"}
                </div>
              </div>
              <div className="text-sm">{timeAgo(cart.createdAt)}</div>
              <div className="text-sm font-semibold">
                ${cart.overAllTotal.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {cart.items
                  .map(
                    (i) =>
                      `${i.productName}${
                        i.productQty ? " " + i.productQty : ""
                      }${
                        i.productQtyType ? ` (${i.productQtyType})` : ""
                      }`
                  )
                  .join(", ")}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const GroupDropdown: React.FC<{
  groupBy: "none" | "month" | "quarter";
  setGroupBy: (g: "none" | "month" | "quarter") => void;
}> = ({ groupBy, setGroupBy }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const options: { value: "none" | "month" | "quarter"; label: string }[] = [
    { value: "none", label: "None" },
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 text-sm bg-background text-foreground border border-border rounded px-2 py-1"
        aria-expanded={open}
      >
        {options.find((o) => o.value === groupBy)?.label || "Group"}
        <span className="ml-1">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded border border-border bg-background shadow-md z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setGroupBy(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/20 ${
                groupBy === opt.value ? "font-semibold" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const SalesTable: React.FC<SalesTableProps> = ({ carts }) => {
  const [isMdUp, setIsMdUp] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [groupBy, setGroupBy] = useState<"none" | "month" | "quarter">("none");

  useEffect(() => {
    const onResize = () => setIsMdUp(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const groups = useMemo(() => {
    if (groupBy === "none") return null;
    const map = new Map<string, CartModel[]>();
    carts.forEach((cart) => {
      const d = new Date(cart.createdAt || new Date().toISOString());
      const year = d.getFullYear();
      if (groupBy === "month") {
        const label = `${monthName(d.getMonth() + 1)} ${year}`;
        const arr = map.get(label) || [];
        arr.push(cart);
        map.set(label, arr);
      } else if (groupBy === "quarter") {
        const q = Math.floor(d.getMonth() / 3) + 1;
        const label = `Q${q} ${year}`;
        const arr = map.get(label) || [];
        arr.push(cart);
        map.set(label, arr);
      }
    });
    return Array.from(map.entries()).map(([label, items]) => ({
      label,
      items,
      total: items.reduce((s, it) => s + (it.overAllTotal || 0), 0),
    }));
  }, [carts, groupBy]);

  const renderContent = () => {
    if (!groups) {
      return isMdUp ? (
        <SalesTableDesktop carts={carts} />
      ) : (
        <SalesTableMobile carts={carts} />
      );
    }
    return (
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-4 py-2 flex items-center justify-between text-sm font-semibold">
              <div>{g.label}</div>
              <div className="font-medium">Total: ${g.total.toFixed(2)}</div>
            </div>
            <div className="rounded-xl border border-border bg-card/10 overflow-hidden">
              {isMdUp ? (
                <SalesTableDesktop carts={g.items} />
              ) : (
                <SalesTableMobile carts={g.items} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-end px-2 py-1">
        <label className="text-sm text-muted-foreground mr-2">Group:</label>
        <GroupDropdown groupBy={groupBy} setGroupBy={setGroupBy} />
      </div>
      {renderContent()}
    </div>
  );
};
