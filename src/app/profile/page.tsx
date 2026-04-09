"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProfile, saveProfile } from "@/lib/store";
import { Profile, Archetype } from "@/lib/types";
import { User, Plus, X, Save, CheckCircle2 } from "lucide-react";

const EMPTY_PROFILE: Profile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  portfolio: "",
  github: "",
  headline: "",
  exit_story: "",
  superpowers: [],
  target_roles: [],
  archetypes: [],
  compensation: { target_range: "", currency: "USD", minimum: 0 },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);
  const [newSuperpower, setNewSuperpower] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newArchName, setNewArchName] = useState("");
  const [newArchLevel, setNewArchLevel] = useState("");
  const [newArchFit, setNewArchFit] = useState<Archetype["fit"]>("primary");

  useEffect(() => {
    getProfile().then(stored => {
      if (stored) setProfile(stored);
    });
  }, []);

  async function handleSave() {
    await saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update(field: keyof Profile, value: unknown) {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function addSuperpower() {
    if (!newSuperpower.trim()) return;
    update("superpowers", [...profile.superpowers, newSuperpower.trim()]);
    setNewSuperpower("");
  }

  function removeSuperpower(idx: number) {
    update("superpowers", profile.superpowers.filter((_, i) => i !== idx));
  }

  function addRole() {
    if (!newRole.trim()) return;
    update("target_roles", [...profile.target_roles, newRole.trim()]);
    setNewRole("");
  }

  function removeRole(idx: number) {
    update("target_roles", profile.target_roles.filter((_, i) => i !== idx));
  }

  function addArchetype() {
    if (!newArchName.trim()) return;
    update("archetypes", [
      ...profile.archetypes,
      { name: newArchName.trim(), level: newArchLevel || "Senior", fit: newArchFit },
    ]);
    setNewArchName("");
    setNewArchLevel("");
  }

  function removeArchetype(idx: number) {
    update("archetypes", profile.archetypes.filter((_, i) => i !== idx));
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Your candidate profile powers evaluation accuracy
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-4 h-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={profile.name}
                onChange={e => update("name", e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={profile.email}
                onChange={e => update("email", e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={profile.phone || ""}
                onChange={e => update("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={profile.location}
                onChange={e => update("location", e.target.value)}
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input
                value={profile.linkedin || ""}
                onChange={e => update("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/janesmith"
              />
            </div>
            <div>
              <Label>GitHub</Label>
              <Input
                value={profile.github || ""}
                onChange={e => update("github", e.target.value)}
                placeholder="https://github.com/janesmith"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Portfolio</Label>
              <Input
                value={profile.portfolio || ""}
                onChange={e => update("portfolio", e.target.value)}
                placeholder="https://janesmith.dev"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Narrative */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Narrative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Professional Headline</Label>
            <Input
              value={profile.headline}
              onChange={e => update("headline", e.target.value)}
              placeholder="Senior Software Engineer specializing in AI/ML platforms"
            />
          </div>
          <div>
            <Label>Exit Story</Label>
            <Textarea
              value={profile.exit_story}
              onChange={e => update("exit_story", e.target.value)}
              placeholder="Brief narrative explaining your career transition or what you're looking for next..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Superpowers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Superpowers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {profile.superpowers.map((sp, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {sp}
                <button onClick={() => removeSuperpower(i)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSuperpower}
              onChange={e => setNewSuperpower(e.target.value)}
              placeholder="Add a superpower..."
              onKeyDown={e => e.key === "Enter" && addSuperpower()}
            />
            <Button variant="outline" onClick={addSuperpower}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Target Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Target Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {profile.target_roles.map((role, i) => (
              <Badge key={i} className="bg-primary/10 text-primary border-primary/20 gap-1 pr-1">
                {role}
                <button onClick={() => removeRole(i)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              placeholder="Add a target role..."
              onKeyDown={e => e.key === "Enter" && addRole()}
            />
            <Button variant="outline" onClick={addRole}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Archetypes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Career Archetypes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.archetypes.map((arch, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
              <div className="flex-1">
                <span className="font-medium text-sm">{arch.name}</span>
                <span className="text-xs text-muted-foreground ml-2">({arch.level})</span>
              </div>
              <Badge
                variant="secondary"
                className={
                  arch.fit === "primary"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : arch.fit === "secondary"
                    ? "bg-blue-500/15 text-blue-600"
                    : "bg-zinc-500/15 text-zinc-600"
                }
              >
                {arch.fit}
              </Badge>
              <button onClick={() => removeArchetype(i)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Separator />
          <div className="flex gap-3">
            <Input
              value={newArchName}
              onChange={e => setNewArchName(e.target.value)}
              placeholder="Archetype name"
              className="flex-1"
            />
            <Input
              value={newArchLevel}
              onChange={e => setNewArchLevel(e.target.value)}
              placeholder="Level"
              className="w-32"
            />
            <Select value={newArchFit} onValueChange={v => setNewArchFit(v as Archetype["fit"])}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="adjacent">Adjacent</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={addArchetype}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compensation Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Target Range</Label>
              <Input
                value={profile.compensation.target_range}
                onChange={e =>
                  update("compensation", { ...profile.compensation, target_range: e.target.value })
                }
                placeholder="$180K - $250K"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select
                value={profile.compensation.currency}
                onValueChange={v =>
                  update("compensation", { ...profile.compensation, currency: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Minimum</Label>
              <Input
                type="number"
                value={profile.compensation.minimum || ""}
                onChange={e =>
                  update("compensation", {
                    ...profile.compensation,
                    minimum: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="150000"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
