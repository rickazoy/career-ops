"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
} from "lucide-react";

interface PortalEntry {
  id: string;
  name: string;
  careers_url: string;
  category: string;
  enabled: boolean;
}

const DEFAULT_PORTALS: Omit<PortalEntry, "id" | "enabled">[] = [
  { name: "Anthropic", careers_url: "https://www.anthropic.com/careers", category: "AI Labs" },
  { name: "OpenAI", careers_url: "https://openai.com/careers", category: "AI Labs" },
  { name: "Mistral AI", careers_url: "https://mistral.ai/careers", category: "AI Labs" },
  { name: "Cohere", careers_url: "https://cohere.com/careers", category: "AI Labs" },
  { name: "ElevenLabs", careers_url: "https://elevenlabs.io/careers", category: "Voice AI" },
  { name: "Vercel", careers_url: "https://vercel.com/careers", category: "AI Platforms" },
  { name: "Supabase", careers_url: "https://supabase.com/careers", category: "AI Platforms" },
  { name: "n8n", careers_url: "https://n8n.io/careers", category: "Automation" },
  { name: "Retool", careers_url: "https://retool.com/careers", category: "AI Platforms" },
  { name: "Stripe", careers_url: "https://stripe.com/jobs", category: "Enterprise" },
  { name: "Datadog", careers_url: "https://careers.datadoghq.com", category: "Enterprise" },
  { name: "Cloudflare", careers_url: "https://www.cloudflare.com/careers", category: "Enterprise" },
  { name: "Linear", careers_url: "https://linear.app/careers", category: "Tools" },
  { name: "Notion", careers_url: "https://www.notion.so/careers", category: "Tools" },
  { name: "Figma", careers_url: "https://www.figma.com/careers", category: "Tools" },
  { name: "Cursor", careers_url: "https://www.cursor.com/careers", category: "AI Tools" },
  { name: "Replit", careers_url: "https://replit.com/careers", category: "AI Tools" },
];

export default function ScannerPage() {
  const [portals, setPortals] = useState<PortalEntry[]>(() =>
    DEFAULT_PORTALS.map(p => ({ ...p, id: crypto.randomUUID(), enabled: true }))
  );
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const categories = [...new Set(portals.map(p => p.category))];

  function addPortal() {
    if (!newName.trim() || !newUrl.trim()) return;
    setPortals(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newName.trim(),
        careers_url: newUrl.trim(),
        category: newCategory.trim() || "Custom",
        enabled: true,
      },
    ]);
    setNewName("");
    setNewUrl("");
    setNewCategory("");
  }

  function togglePortal(id: string) {
    setPortals(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  }

  function removePortal(id: string) {
    setPortals(prev => prev.filter(p => p.id !== id));
  }

  const enabledCount = portals.filter(p => p.enabled).length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal Scanner</h1>
          <p className="text-muted-foreground mt-1">
            Manage {portals.length} career portals ({enabledCount} active)
          </p>
        </div>
      </div>

      {/* Add Portal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Portal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Company name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder="Careers page URL"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Category"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-36"
            />
            <Button onClick={addPortal} disabled={!newName.trim() || !newUrl.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Portal Grid by Category */}
      {categories.map(cat => {
        const catPortals = portals.filter(p => p.category === cat);
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">{cat}</h2>
              <Badge variant="secondary" className="text-xs">
                {catPortals.filter(p => p.enabled).length}/{catPortals.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {catPortals.map(portal => (
                <Card
                  key={portal.id}
                  className={portal.enabled ? "" : "opacity-50"}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Switch
                          checked={portal.enabled}
                          onCheckedChange={() => togglePortal(portal.id)}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{portal.name}</p>
                          <a
                            href={portal.careers_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Careers page
                          </a>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removePortal(portal.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
