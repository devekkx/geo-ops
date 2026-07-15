import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  viewChild
} from "@angular/core";
import Collection from "ol/Collection";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Translate } from "ol/interaction";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import Map from "ol/Map";
import { fromLonLat, toLonLat } from "ol/proj";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import View from "ol/View";

import type { Coordinate } from "ol/coordinate";

export interface FacilityCoordinates {
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER: Coordinate = [-0.187, 5.6037];
const DEFAULT_ZOOM = 7;
const SELECTED_ZOOM = 13;
const COORDINATE_EPSILON = 1e-6;

const MARKER_STYLE = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: "#ff5a00" }),
    stroke: new Stroke({ color: "#ffffff", width: 2 })
  })
});

@Component({
  selector: "geo-facility-location-picker",
  template: `<div
    #mapHost
    class="size-full"
    role="application"
    aria-label="Map for choosing the facility's location. Click anywhere, or drag the marker, to set the coordinates."
  ></div>`,
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
export class FacilityLocationPicker implements OnDestroy {
  readonly latitude = input<number | null>(null);
  readonly longitude = input<number | null>(null);
  readonly coordinatesChange = output<FacilityCoordinates>();

  private readonly mapHost = viewChild.required<ElementRef<HTMLDivElement>>("mapHost");
  private readonly markerFeature = new Feature();
  private map?: Map;
  private lastEmitted: FacilityCoordinates | null = null;

  constructor() {
    afterNextRender(() => {
      this.initializeMap();
    });

    effect(() => {
      this.syncFromInputs(this.latitude(), this.longitude());
    });
  }

  ngOnDestroy(): void {
    this.map?.setTarget();
    this.map = undefined;
  }

  private initializeMap(): void {
    const latitude = this.latitude();
    const longitude = this.longitude();
    const hasPosition = latitude !== null && longitude !== null;
    const center = hasPosition ? fromLonLat([longitude, latitude]) : fromLonLat(DEFAULT_CENTER);

    this.markerFeature.setStyle(MARKER_STYLE);
    if (hasPosition) {
      this.markerFeature.setGeometry(new Point(center));
      this.lastEmitted = { latitude, longitude };
    }

    const markerSource = new VectorSource({ features: [this.markerFeature] });

    this.map = new Map({
      target: this.mapHost().nativeElement,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source: markerSource })],
      view: new View({ center, zoom: hasPosition ? SELECTED_ZOOM : DEFAULT_ZOOM }),
      controls: []
    });

    this.map.on("click", (event) => {
      this.markerFeature.setGeometry(new Point(event.coordinate));
      this.emitCoordinates(event.coordinate);
    });

    const translate = new Translate({ features: new Collection([this.markerFeature]) });
    translate.on("translateend", (event) => {
      this.emitCoordinates(event.coordinate);
    });
    this.map.addInteraction(translate);
  }

  /** Reflects coordinates typed directly into the form fields onto the map. */
  private syncFromInputs(latitude: number | null, longitude: number | null): void {
    if (!this.map || latitude === null || longitude === null) {
      return;
    }
    if (this.lastEmitted && this.isSameCoordinate(this.lastEmitted, { latitude, longitude })) {
      return;
    }

    const center = fromLonLat([longitude, latitude]);
    this.markerFeature.setGeometry(new Point(center));
    this.lastEmitted = { latitude, longitude };

    const view = this.map.getView();
    view.setCenter(center);
    view.setZoom(SELECTED_ZOOM);
  }

  private isSameCoordinate(a: FacilityCoordinates, b: FacilityCoordinates): boolean {
    return (
      Math.abs(a.latitude - b.latitude) < COORDINATE_EPSILON &&
      Math.abs(a.longitude - b.longitude) < COORDINATE_EPSILON
    );
  }

  private emitCoordinates(coordinate: Coordinate): void {
    const [longitude, latitude] = toLonLat(coordinate);
    this.lastEmitted = { latitude, longitude };
    this.coordinatesChange.emit({ latitude, longitude });
  }
}
