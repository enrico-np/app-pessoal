"use client";

import { useState } from "react";
import { Button, Dialog, Icon, Input, Select } from "@/components/ui";
import { ICON_LABELS, ICON_NAMES, type IconName } from "@/components/ui/icon-names";
import { pressFlat } from "@/components/ui/pressable";
import { APP_PAGES, appPage } from "@/features/catalog";
import { cn } from "@/lib/cn";
import type { DraftPin } from "../../draft";
import type { PinInput } from "../../validation";

const LINK = "link";

// Add or change a pin: destination (an app page or a pasted link), name and icon (spec 003).
export function PinDialog({
  pin,
  error,
  onClose,
  onSave,
}: {
  pin?: DraftPin;
  error: string | null;
  onClose: () => void;
  onSave: (input: PinInput) => void;
}) {
  const initialPage = pin ? appPage(pin.href) : APP_PAGES[0];
  const [destination, setDestination] = useState(initialPage?.href ?? LINK);
  const [url, setUrl] = useState(pin && !initialPage ? pin.href : "");
  const [label, setLabel] = useState(pin?.label ?? "");
  const [icon, setIcon] = useState<IconName>((pin?.icon as IconName) ?? initialPage?.icon ?? "link");
  // Choosing a page fills the icon until the user picks one.
  const [iconChosen, setIconChosen] = useState(pin !== undefined);
  const [linkError, setLinkError] = useState<string | null>(null);

  function chooseDestination(value: string) {
    setDestination(value);
    setLinkError(null);
    const page = appPage(value);
    if (page && label.trim() === "") setLabel(page.label);
    if (!iconChosen) setIcon(page?.icon ?? "link");
  }

  return (
    <Dialog open onClose={onClose} title={pin ? `Trocar “${pin.label}”` : "Fixar atalho"}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (destination === LINK && !/^https?:\/\//i.test(url.trim())) {
            return setLinkError("Cole um endereço que comece com http:// ou https://.");
          }
          onSave({ label, icon, href: destination === LINK ? url.trim() : destination });
        }}
      >
        <Select
          label="Destino"
          value={destination}
          onChange={(e) => chooseDestination(e.target.value)}
          options={[...APP_PAGES.map((p) => ({ value: p.href, label: p.label })), { value: LINK, label: "Link" }]}
        />
        {destination === LINK && (
          // A text field, not type="url": the browser's own URL check would block the submit with an
          // English bubble before the pt-BR message below can show.
          <Input
            label="Link"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setLinkError(null);
            }}
            placeholder="https://…"
          />
        )}
        <Input label="Nome" value={label} maxLength={20} onChange={(e) => setLabel(e.target.value)} />
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">Ícone</legend>
          <div role="radiogroup" className="grid grid-cols-6 gap-1">
            {ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={icon === name}
                aria-label={ICON_LABELS[name]}
                onClick={() => {
                  setIcon(name);
                  setIconChosen(true);
                }}
                className={cn(
                  "flex size-tap items-center justify-center rounded-control border-2 [&_svg]:size-5",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                  pressFlat,
                  icon === name ? "border-border bg-accent text-accent-foreground" : "border-transparent hover:bg-foreground/10",
                )}
              >
                <Icon name={name} />
              </button>
            ))}
          </div>
        </fieldset>
        {(linkError ?? error) && (
          <p role="alert" className="text-sm text-danger">
            {linkError ?? error}
          </p>
        )}
        <Button type="submit" className="min-h-12 text-base font-bold">
          {pin ? "Salvar" : "Fixar"}
        </Button>
      </form>
    </Dialog>
  );
}
