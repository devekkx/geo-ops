import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  output,
  viewChild
} from "@angular/core";
import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import { boundingExtent } from "ol/extent";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { Icon, Style } from "ol/style";

import { FACILITY_STATUS_COLORS } from "@core/constants/facility.constants";
import type { Facility } from "@core/interfaces/facility.interface";
import { MARKER_ICON_ANCHOR, MARKER_ICON_SRC } from "@shared/constants/map-marker.constants";

const SINGLE_MARKER_ZOOM = 13;
const MAX_FIT_ZOOM = 15;
const FIT_PADDING = [48, 48, 48, 48];
const MARKER_SCALE = 1.1;
const SELECTED_MARKER_SCALE = 1.4;

@Component({
  selector: "geo-facility-map",
  template: `<div #mapHost class="size-full" role="img" [attr.aria-label]="ariaLabel()"></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `
  ]
})
export class FacilityMap implements OnDestroy {
  readonly facilities = input.required<Facility[]>();
  readonly selectedId = input<string | null>(null);
  readonly markerClick = output<string>();
  protected readonly ariaLabel = computed(() => {
    const facilities = this.facilities();
    return facilities.length === 1
      ? `Map showing the location of ${facilities[0].name}`
      : `Map showing the location of ${facilities.length} facilities`;
  });
  private readonly mapHost = viewChild.required<ElementRef<HTMLDivElement>>("mapHost");
  private readonly vectorSource = new VectorSource();
  private map?: Map;

  constructor() {
    effect(() => {
      this.facilities();
      this.selectedId();
      this.renderMarkers();
    });

    afterNextRender(() => {
      this.initializeMap(this.mapHost().nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.map?.setTarget();
    this.map = undefined;
  }

  private initializeMap(target: HTMLDivElement): void {
    if (this.map) {
      return;
    }
    this.map = new Map({
      target,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: this.vectorSource })
      ],
      view: new View({ center: fromLonLat([0, 0]), zoom: 2 }),
      controls: []
    });
    this.map.on("click", (event) => {
      const feature = this.map?.forEachFeatureAtPixel(event.pixel, (found) => found);
      const facilityId = feature?.get("facilityId") as string | undefined;
      if (facilityId) {
        this.markerClick.emit(facilityId);
      }
    });
    this.renderMarkers();
  }

  private renderMarkers(): void {
    if (!this.map) {
      return;
    }
    const facilities = this.facilities();
    this.vectorSource.clear();

    for (const facility of facilities) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([facility.longitude, facility.latitude]))
      });
      feature.set("facilityId", facility.id);
      const isSelected = facility.id === this.selectedId();
      feature.setStyle(
        new Style({
          image: new Icon({
            src: MARKER_ICON_SRC,
            anchor: MARKER_ICON_ANCHOR,
            color: FACILITY_STATUS_COLORS[facility.status],
            scale: isSelected ? SELECTED_MARKER_SCALE : MARKER_SCALE
          })
        })
      );
      this.vectorSource.addFeature(feature);
    }

    this.fitView(facilities);
  }

  private fitView(facilities: Facility[]): void {
    if (!this.map || facilities.length === 0) {
      return;
    }
    const view = this.map.getView();
    const selected = facilities.find((facility) => facility.id === this.selectedId());

    if (facilities.length === 1 || selected) {
      const target = selected ?? facilities[0];
      view.setCenter(fromLonLat([target.longitude, target.latitude]));
      view.setZoom(SINGLE_MARKER_ZOOM);
      return;
    }

    const coordinates = facilities.map((facility) =>
      fromLonLat([facility.longitude, facility.latitude])
    );
    view.fit(boundingExtent(coordinates), { padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM });
  }
}
