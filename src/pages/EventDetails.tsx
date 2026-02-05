 import { useState, useMemo } from "react";
 import { useParams, useNavigate, Link } from "react-router-dom";
 import { format } from "date-fns";
 import {
   ArrowLeft,
   Bot,
   MapPin,
   Clock,
   Users,
   Zap,
   AlertTriangle,
   Info,
   Cable,
   Box,
   ExternalLink,
   Gauge,
   ShieldAlert,
   Activity,
   ChevronDown,
   ChevronUp,
   Map,
   Calendar,
   Building2,
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { OutageTypeBadge } from "@/components/ui/outage-type-badge";
 import { StatusBadge } from "@/components/ui/status-badge";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 import { useScenarioWithIntelligence } from "@/hooks/useScenarios";
 import { useAssets, useEventAssets } from "@/hooks/useAssets";
 import { EtrRunwayExplainer } from "@/components/map/EtrRunwayExplainer";
import { EtrMovementExplainer } from "@/components/map/EtrMovementExplainer";
 import type { ScenarioWithIntelligence, EtrConfidence, EtrRiskLevel, CriticalRunwayStatus } from "@/types/scenario";
 
 export default function EventDetails() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { data: event, isLoading, error } = useScenarioWithIntelligence(id || null);
   const { data: assets = [] } = useAssets();
   const { data: linkedAssetIds = [] } = useEventAssets(id || null);
 
   const linkedAssets = useMemo(() => {
     return assets.filter((a) => linkedAssetIds.includes(a.id));
   }, [assets, linkedAssetIds]);
 
   const assetCounts = useMemo(() => ({
     Fault: linkedAssets.filter((a) => a.asset_type === "Fault").length,
     Feeder: linkedAssets.filter((a) => a.asset_type === "Feeder").length,
     Transformer: linkedAssets.filter((a) => a.asset_type === "Transformer").length,
   }), [linkedAssets]);
 
   const handleOpenInCopilot = () => {
     if (!event) return;
     const prompt = encodeURIComponent(
       `Summarize outage context, risks, trade-offs, and checklist for this event: "${event.name}" (${event.outage_type || "Unknown"} - ${event.lifecycle_stage})`
     );
     navigate(`/copilot-studio?prefill=${prompt}`);
   };
 
   const handleViewOnMap = () => {
     if (!event) return;
     navigate(`/outage-map?event=${event.id}`);
   };
 
   if (isLoading) {
     return (
       <div className="min-h-screen bg-background">
         <div className="max-w-6xl mx-auto p-6 space-y-6">
           <Skeleton className="h-10 w-48" />
           <Skeleton className="h-8 w-96" />
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Skeleton className="h-64 lg:col-span-2" />
             <Skeleton className="h-64" />
           </div>
         </div>
       </div>
     );
   }
 
   if (error || !event) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="text-center space-y-4">
           <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto" />
           <h1 className="text-xl font-semibold text-foreground">Event Not Found</h1>
           <p className="text-muted-foreground">The requested event could not be loaded.</p>
           <Button variant="outline" onClick={() => navigate("/outage-map")}>
             <ArrowLeft className="w-4 h-4 mr-2" />
             Back to Outage Map
           </Button>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background">
       {/* Top Navigation Bar */}
       <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between h-14">
             <div className="flex items-center gap-4">
               <Button variant="ghost" size="sm" onClick={() => navigate("/outage-map")} className="gap-2">
                 <ArrowLeft className="w-4 h-4" />
                 <span className="hidden sm:inline">Back to Map</span>
               </Button>
               <Separator orientation="vertical" className="h-6" />
               <span className="text-xs text-muted-foreground uppercase tracking-wide">Event Details</span>
             </div>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={handleViewOnMap} className="gap-2">
                 <Map className="w-4 h-4" />
                 <span className="hidden sm:inline">View on Map</span>
               </Button>
               <Button size="sm" onClick={handleOpenInCopilot} className="gap-2">
                 <Bot className="w-4 h-4" />
                 <span className="hidden sm:inline">Open in Copilot</span>
               </Button>
             </div>
           </div>
         </div>
       </header>
 
       {/* Main Content */}
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
         {/* Event Header */}
         <div className="mb-8">
           <div className="flex items-start justify-between gap-4 flex-wrap">
             <div className="space-y-2">
               <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
               <div className="flex items-center gap-2 flex-wrap">
                 <StatusBadge
                   variant={event.lifecycle_stage === "Event" ? "event" : event.lifecycle_stage === "Pre-Event" ? "pre-event" : "post-event"}
                 >
                   {event.lifecycle_stage}
                 </StatusBadge>
                 {event.outage_type && <OutageTypeBadge type={event.outage_type} />}
                 {event.priority && (
                   <StatusBadge variant={event.priority === "high" ? "high" : event.priority === "medium" ? "medium" : "low"}>
                     {event.priority} priority
                   </StatusBadge>
                 )}
               </div>
             </div>
             {event.requires_escalation && (
               <div className="px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4 text-warning" />
                 <span className="text-sm font-medium text-warning">Escalation Required</span>
               </div>
             )}
           </div>
         </div>
 
         {/* Content Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left Column - Main Content (2/3) */}
           <div className="lg:col-span-2 space-y-6">
             {/* Impact Overview */}
             <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                   <Users className="w-4 h-4" />
                   Impact Overview
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   <MetricBox
                     label="Customers Impacted"
                     value={event.customers_impacted?.toLocaleString() || "—"}
                     icon={<Users className="w-4 h-4" />}
                   />
                   <MetricBox
                     label="ETR"
                     value={event.eta ? format(new Date(event.eta), "MMM d, h:mm a") : "—"}
                     icon={<Clock className="w-4 h-4" />}
                     small
                   />
                   <MetricBox
                     label="Location"
                     value={event.location_name || event.service_area || "—"}
                     icon={<MapPin className="w-4 h-4" />}
                     small
                   />
                   <MetricBox
                     label="Service Area"
                     value={event.service_area || "—"}
                     icon={<Building2 className="w-4 h-4" />}
                     small
                   />
                 </div>
               </CardContent>
             </Card>
 
             {/* ETR & Critical Load Analysis */}
             <Card>
               <CardHeader className="pb-3">
                 <div className="flex items-center justify-between gap-4 flex-wrap">
                   <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                     <Gauge className="w-4 h-4 text-primary" />
                     ETR & Critical Load Analysis
                   </CardTitle>
                   {event.requires_escalation && (
                     <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                       <AlertTriangle className="w-3 h-3 mr-1" />
                       Escalation Required
                     </Badge>
                   )}
                 </div>
               </CardHeader>
               <CardContent className="space-y-6">
                 {/* ETR Confidence */}
                 <EtrConfidenceBlock event={event} />
 
                 <Separator />
 
                 {/* Critical Load Runway */}
                 <CriticalLoadBlock event={event} />
 
                 <Separator />
 
                 {/* Copilot Explainer */}
                 <EtrRunwayExplainer event={event} />

                  {/* ETR Movement History Explainer */}
                  <EtrMovementExplainer event={event} />
               </CardContent>
             </Card>
 
             {/* Notes */}
             {(event.description || event.notes) && (
               <Card>
                 <CardHeader className="pb-3">
                   <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                     <Info className="w-4 h-4" />
                     Notes & Description
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                     {event.notes || event.description}
                   </p>
                 </CardContent>
               </Card>
             )}
           </div>
 
           {/* Right Column - Sidebar (1/3) */}
           <div className="space-y-6">
             {/* Infrastructure Details */}
             <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                   <Zap className="w-4 h-4" />
                   Infrastructure
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-0 divide-y divide-border">
                 <InfoRow label="Fault ID" value={event.fault_id} />
                 <InfoRow label="Feeder ID" value={event.feeder_id} />
                 <InfoRow label="Transformer ID" value={event.transformer_id} />
               </CardContent>
             </Card>
 
             {/* Linked Assets */}
             {linkedAssets.length > 0 && (
               <Card>
                 <CardHeader className="pb-3">
                   <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                     <Box className="w-4 h-4" />
                     Linked Assets
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-wrap gap-2">
                     {assetCounts.Fault > 0 && (
                       <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1.5">
                         <Zap className="w-3 h-3" />
                         {assetCounts.Fault} Fault{assetCounts.Fault !== 1 && "s"}
                       </Badge>
                     )}
                     {assetCounts.Feeder > 0 && (
                       <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1.5">
                         <Cable className="w-3 h-3" />
                         {assetCounts.Feeder} Feeder{assetCounts.Feeder !== 1 && "s"}
                       </Badge>
                     )}
                     {assetCounts.Transformer > 0 && (
                       <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1.5">
                         <Box className="w-3 h-3" />
                         {assetCounts.Transformer} Transformer{assetCounts.Transformer !== 1 && "s"}
                       </Badge>
                     )}
                   </div>
                 </CardContent>
               </Card>
             )}
 
             {/* Location Details */}
             {(event.location_name || event.geo_center) && (
               <Card>
                 <CardHeader className="pb-3">
                   <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                     <MapPin className="w-4 h-4" />
                     Location
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-2">
                     {event.location_name && <p className="text-sm font-medium text-foreground">{event.location_name}</p>}
                     {event.service_area && <p className="text-xs text-muted-foreground">{event.service_area}</p>}
                     {event.geo_center && (
                       <p className="text-[10px] font-mono text-muted-foreground mt-2">
                         {event.geo_center.lat.toFixed(4)}, {event.geo_center.lng.toFixed(4)}
                       </p>
                     )}
                     <p className="text-[10px] text-muted-foreground/60">Demo geography</p>
                   </div>
                 </CardContent>
               </Card>
             )}
 
             {/* Event Timeline */}
             <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                   <Calendar className="w-4 h-4" />
                   Timeline
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-0 divide-y divide-border">
                 <InfoRow label="Event Start" value={event.event_start_time ? format(new Date(event.event_start_time), "MMM d, h:mm a") : null} />
                 <InfoRow label="Last Update" value={event.event_last_update_time ? format(new Date(event.event_last_update_time), "MMM d, h:mm a") : null} />
                 <InfoRow label="Event End" value={event.event_end_time ? format(new Date(event.event_end_time), "MMM d, h:mm a") : null} />
                 <InfoRow label="Created" value={event.created_at ? format(new Date(event.created_at), "MMM d, yyyy") : null} />
               </CardContent>
             </Card>
 
             {/* Operator Role */}
             {event.operator_role && (
               <Card className="bg-primary/5 border-primary/20">
                 <CardContent className="pt-4">
                   <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Assigned Role</span>
                   <p className="text-sm font-medium text-foreground mt-1">{event.operator_role}</p>
                 </CardContent>
               </Card>
             )}
           </div>
         </div>
       </main>
     </div>
   );
 }
 
 // ===== ETR Confidence Block =====
 
 function EtrConfidenceBlock({ event }: { event: ScenarioWithIntelligence }) {
   const hasEtrData = event.etr_earliest || event.etr_latest || event.etr_confidence;
 
   if (!hasEtrData) {
     return (
       <div className="text-sm text-muted-foreground">No ETR data available for this event.</div>
     );
   }
 
   const formatEtrTime = (dateStr: string | null) => {
     if (!dateStr) return "—";
     return format(new Date(dateStr), "h:mm a");
   };
 
   const getConfidenceBadgeStyle = (confidence: EtrConfidence | null) => {
     switch (confidence) {
       case "HIGH":
         return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
       case "MEDIUM":
         return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
       case "LOW":
         return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
       default:
         return "bg-muted text-muted-foreground border-border";
     }
   };
 
   const getRiskBadgeStyle = (risk: EtrRiskLevel | null) => {
     switch (risk) {
       case "LOW":
         return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
       case "MEDIUM":
         return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
       case "HIGH":
         return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
       default:
         return "bg-muted text-muted-foreground border-border";
     }
   };
 
   const uncertaintyDrivers = event.etr_uncertainty_drivers || [];
 
   return (
     <div className="space-y-4">
       <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">ETR Confidence</h4>
 
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         {/* Restoration Window */}
         {(event.etr_earliest || event.etr_latest) && (
           <div className="p-4 rounded-lg bg-muted/40 border border-border">
             <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-2">Restoration Window</span>
             <div className="flex items-center gap-2 text-lg font-semibold">
               <span className="font-mono text-foreground">{formatEtrTime(event.etr_earliest)}</span>
               <span className="text-muted-foreground">→</span>
               <span className="font-mono text-foreground">{formatEtrTime(event.etr_latest)}</span>
             </div>
             {event.etr_band_hours !== null && (
               <p className="text-xs text-muted-foreground mt-2">
                 Band width: {event.etr_band_hours.toFixed(1)} hours
               </p>
             )}
           </div>
         )}
 
         {/* Confidence & Risk */}
         <div className="p-4 rounded-lg bg-muted/40 border border-border">
           <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-2">Assessment</span>
           <div className="flex items-center gap-2 flex-wrap">
             {event.etr_confidence && (
               <Badge variant="outline" className={`${getConfidenceBadgeStyle(event.etr_confidence)}`}>
                 Confidence: {event.etr_confidence}
               </Badge>
             )}
             {event.etr_risk_level && (
               <Badge variant="outline" className={`${getRiskBadgeStyle(event.etr_risk_level)}`}>
                 Risk: {event.etr_risk_level}
               </Badge>
             )}
           </div>
         </div>
       </div>
 
       {/* Uncertainty Drivers */}
       {uncertaintyDrivers.length > 0 && (
         <div>
           <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-2">Uncertainty Factors</span>
           <div className="flex flex-wrap gap-2">
             {uncertaintyDrivers.map((driver, idx) => (
               <span
                 key={idx}
                 className="text-xs px-3 py-1 rounded-full bg-muted/70 text-muted-foreground border border-border"
               >
                 {driver}
               </span>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 }
 
 // ===== Critical Load Block =====
 
 function CriticalLoadBlock({ event }: { event: ScenarioWithIntelligence }) {
   const getRunwayStatusStyle = (status: CriticalRunwayStatus | null) => {
     switch (status) {
       case "NORMAL":
         return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
       case "AT_RISK":
         return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
       case "BREACH":
         return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
       default:
         return "bg-muted text-muted-foreground border-border";
     }
   };
 
   const criticalLoadTypes = event.critical_load_types || [];
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between gap-4">
         <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
           <ShieldAlert className="w-4 h-4" />
           Critical Load Continuity
         </h4>
         {event.critical_runway_status && (
           <Badge variant="outline" className={`${getRunwayStatusStyle(event.critical_runway_status)}`}>
             {event.critical_runway_status.replace("_", " ")}
           </Badge>
         )}
       </div>
 
       {!event.has_critical_load ? (
         <p className="text-sm text-muted-foreground">No critical load identified for this event.</p>
       ) : (
         <div className="space-y-4">
           {/* Critical Load Types */}
           {criticalLoadTypes.length > 0 && (
             <div className="flex flex-wrap gap-2">
               {criticalLoadTypes.map((loadType, idx) => (
                 <Badge key={idx} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                   {loadType}
                 </Badge>
               ))}
             </div>
           )}
 
           {/* Runtime Stats */}
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
             {event.backup_runtime_remaining_hours !== null && (
               <div className="p-4 rounded-lg bg-muted/40 border border-border">
                 <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Hours Remaining</span>
                 <span className="text-2xl font-bold text-foreground">
                   {event.backup_runtime_remaining_hours.toFixed(1)}
                 </span>
               </div>
             )}
             {event.critical_escalation_threshold_hours !== null && (
               <div className="p-4 rounded-lg bg-muted/40 border border-border">
                 <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Escalation Threshold</span>
                 <span className="text-2xl font-bold text-foreground">
                   {event.critical_escalation_threshold_hours.toFixed(1)}
                 </span>
               </div>
             )}
             {event.backup_runtime_hours !== null && (
               <div className="p-4 rounded-lg bg-muted/40 border border-border">
                 <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Total Backup Runtime</span>
                 <span className="text-2xl font-bold text-foreground">
                   {event.backup_runtime_hours.toFixed(1)}
                 </span>
               </div>
             )}
           </div>
 
           {/* Progress Bar */}
           {event.backup_runtime_hours && event.backup_runtime_remaining_hours !== null && (
             <div className="space-y-1">
               <div className="h-2 rounded-full bg-muted overflow-hidden">
                 <div
                   className={`h-full transition-all ${
                     event.critical_runway_status === "BREACH"
                       ? "bg-red-500"
                       : event.critical_runway_status === "AT_RISK"
                       ? "bg-amber-500"
                       : "bg-emerald-500"
                   }`}
                   style={{
                     width: `${Math.min(100, (event.backup_runtime_remaining_hours / event.backup_runtime_hours) * 100)}%`,
                   }}
                 />
               </div>
               <p className="text-[10px] text-muted-foreground">
                 {((event.backup_runtime_remaining_hours / event.backup_runtime_hours) * 100).toFixed(0)}% remaining
               </p>
             </div>
           )}
 
           {/* Escalation Warning */}
           {event.requires_escalation && (
             <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 flex items-center gap-3">
               <Activity className="w-5 h-5 text-warning flex-shrink-0" />
               <p className="text-sm text-warning">
                 <span className="font-medium">Escalation required</span> — operator review needed before critical threshold breach.
               </p>
             </div>
           )}
         </div>
       )}
     </div>
   );
 }
 
 // ===== Helper Components =====
 
 function MetricBox({
   icon,
   label,
   value,
   small = false,
 }: {
   icon: React.ReactNode;
   label: string;
   value: string;
   small?: boolean;
 }) {
   return (
     <div className="p-4 rounded-lg bg-muted/40 border border-border">
       <div className="flex items-center gap-2 text-muted-foreground mb-2">
         {icon}
         <span className="text-[10px] uppercase tracking-wide">{label}</span>
       </div>
       <p className={`font-bold text-foreground ${small ? "text-sm" : "text-xl"}`}>{value}</p>
     </div>
   );
 }
 
 function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
   return (
     <div className="flex items-center justify-between py-2.5">
       <span className="text-xs text-muted-foreground">{label}</span>
       <span className="text-sm font-mono text-foreground">{value || "—"}</span>
     </div>
   );
 }