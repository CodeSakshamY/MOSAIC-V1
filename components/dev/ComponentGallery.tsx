"use client";

import { toast } from "sonner";
import { ageGroups } from "@/lib/profile/age-groups";
import { ConfirmDialog } from "@/components/shell/ConfirmDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ComponentGallery() {
  return (
    <div className="gallery">
      <header className="page-header">
        <h1>Components</h1>
        <p className="lede">
          Development-only review of the interface primitives. This page is not
          linked in production.
        </p>
      </header>

      <section>
        <h2>Buttons</h2>
        <div className="gallery-row">
          <Button>Publish project</Button>
          <Button variant="secondary">Follow</Button>
          <Button variant="outline">Save</Button>
          <Button variant="ghost">Cancel</Button>
          <Button size="lg">Large action</Button>
        </div>
      </section>

      <section>
        <h2>Badges</h2>
        <div className="gallery-row">
          <Badge variant="outline">Prototype</Badge>
          <Badge variant="outline" className="border-copper text-copper">
            Seeking
          </Badge>
          <Badge variant="outline">Python</Badge>
        </div>
      </section>

      <section>
        <h2>Fields</h2>
        <div className="gallery-field">
          <Label htmlFor="project-name">Project name</Label>
          <Input id="project-name" placeholder="A small sorting robot" />
        </div>
        <div className="gallery-field mt-4">
          <Label htmlFor="project-note">Note</Label>
          <Textarea id="project-note" placeholder="What changed in this build." />
        </div>
        <div className="gallery-field mt-4">
          <Label htmlFor="age-group">Age group</Label>
          <Select>
            <SelectTrigger id="age-group" className="w-full">
              <SelectValue placeholder="Choose a band" />
            </SelectTrigger>
            <SelectContent>
              {ageGroups.map((group) => (
                <SelectItem key={group.value} value={group.value}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section>
        <h2>Tabs</h2>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="log">Build log</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-3 text-sm text-text-secondary">
            The problem, the approach, and the current status.
          </TabsContent>
          <TabsContent value="log" className="pt-3 text-sm text-text-secondary">
            Progress updates, in the order they were published.
          </TabsContent>
        </Tabs>
      </section>

      <section>
        <h2>Overlays</h2>
        <div className="gallery-row">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => toast("Menu action received")}>
                Send a toast
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hint</Button>
            </TooltipTrigger>
            <TooltipContent>Shown on hover or focus</TooltipContent>
          </Tooltip>
          <ConfirmDialog
            title="Withdraw request to Orbit?"
            description="The project owner will no longer see this request."
            confirmLabel="Withdraw"
            destructive
            onConfirm={() => toast("Request withdrawn")}
            trigger={<Button variant="destructive">Withdraw</Button>}
          />
          <Button variant="secondary" onClick={() => toast("Saved for later")}>
            Show toast
          </Button>
        </div>
      </section>

      <section>
        <h2>Identity and loading</h2>
        <div className="gallery-row">
          <Avatar>
            <AvatarFallback>P</AvatarFallback>
          </Avatar>
          <Skeleton className="h-8 w-40" />
        </div>
      </section>
    </div>
  );
}
