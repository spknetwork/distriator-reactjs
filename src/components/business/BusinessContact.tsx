import {
    Phone,
    Mail,
    Globe,
    MessageSquare,
    Instagram,
    Facebook,
    Twitter,
} from "lucide-react";
import { type Contact } from "../../types/business";

interface BusinessContactProps {
    contact?: Contact;
}

export function BusinessContact({ contact }: BusinessContactProps) {
    if (!contact) return null;

    const handlePhoneClick = (phone: string) => {
        window.open(`tel:${phone}`, "_self");
    };

    const handleWebsiteClick = (website: string) => {
        const url = website.startsWith("http") ? website : `https://${website}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleEmailClick = (email: string) => {
        window.open(`mailto:${email}`, "_self");
    };

    const baseInteractiveClass =
        "flex items-center gap-3 p-3 rounded-lg bg-card cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-primary";

    const baseStaticClass = "flex items-center gap-3 p-3 rounded-lg bg-card";

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>

            {contact.phone && (
                <div
                    className={baseInteractiveClass}
                    onClick={() => handlePhoneClick(contact.phone!)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handlePhoneClick(contact.phone!);
                    }}
                >
                    <Phone className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground truncate">{contact.phone}</span>
                </div>
            )}

            {contact.email && (
                <div
                    className={baseInteractiveClass}
                    onClick={() => handleEmailClick(contact.email!)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleEmailClick(contact.email!);
                    }}
                >
                    <Mail className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground truncate">{contact.email}</span>
                </div>
            )}

            {contact.website && (
                <div
                    className={baseInteractiveClass}
                    onClick={() => handleWebsiteClick(contact.website!)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleWebsiteClick(contact.website!);
                    }}
                >
                    <Globe className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground truncate">{contact.website}</span>
                </div>
            )}

            {contact.notes && (
                <div className={baseStaticClass}>
                    <MessageSquare className="w-6 h-6 text-primary flex-shrink-0" />
                    <p className="text-foreground">{contact.notes}</p>
                </div>
            )}

            {contact.instagram && (
                <a
                    href={contact.instagram.startsWith("http") ? contact.instagram : `https://${contact.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={baseStaticClass}
                >
                    <Instagram className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground truncate">{contact.instagram}</span>
                </a>
            )}

            {contact.facebook && (
                <a
                    href={contact.facebook.startsWith("http") ? contact.facebook : `https://${contact.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={baseStaticClass}
                >
                    <Facebook className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground truncate">{contact.facebook}</span>
                </a>
            )}

            {contact.twitter && (
                <a
                    href={contact.twitter.startsWith("http") ? contact.twitter : `https://${contact.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={baseStaticClass}
                >
                    <Twitter className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground truncate">{contact.twitter}</span>
                </a>
            )}
        </div>
    );
}
