import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
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
import { Icon, Style } from "ol/style";
import View from "ol/View";

import type { Coordinate } from "ol/coordinate";

import { MARKER_ICON_ANCHOR, MARKER_ICON_SRC } from "@shared/constants/map";

export interface FacilityCoordinates {
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER: Coordinate = [-0.187, 5.6037];
const DEFAULT_ZOOM = 7;
const SELECTED_ZOOM = 13;
const COORDINATE_EPSILON = 1e-6;
const MARKER_SCALE = 0.4;
const MARKER_COLOR = "#ff5a00";

const MARKER_STYLE = new Style({
  image: new Icon({
    src: MARKER_ICON_SRC,
    anchor: MARKER_ICON_ANCHOR,
    color: MARKER_COLOR,
    scale: MARKER_SCALE
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
  public readonly latitude = input<number | null>(null);
  public readonly longitude = input<number | null>(null);
  public readonly coordinatesChange = output<FacilityCoordinates>();

  private readonly _mapHost = viewChild.required<ElementRef<HTMLDivElement>>("mapHost");
  private readonly _markerFeature = new Feature();
  private _map?: Map;
  private _lastEmitted: FacilityCoordinates | null = null;

  constructor() {
    afterNextRender(() => {
      this._initializeMap();
    });

    effect(() => {
      this._syncFromInputs(this.latitude(), this.longitude());
    });
  }

  /** Tears down the OpenLayers map instance. */
  public ngOnDestroy(): void {
    this._map?.setTarget();
    this._map = undefined;
  }

  private _initializeMap(): void {
    const latitude = this.latitude();
    const longitude = this.longitude();
    const hasPosition = latitude !== null && longitude !== null;
    const center = hasPosition ? fromLonLat([longitude, latitude]) : fromLonLat(DEFAULT_CENTER);

    this._markerFeature.setStyle(MARKER_STYLE);
    if (hasPosition) {
      this._markerFeature.setGeometry(new Point(center));
      this._lastEmitted = { latitude, longitude };
    }

    const markerSource = new VectorSource({ features: [this._markerFeature] });

    this._map = new Map({
      target: this._mapHost().nativeElement,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source: markerSource })],
      view: new View({ center, zoom: hasPosition ? SELECTED_ZOOM : DEFAULT_ZOOM }),
      controls: []
    });

    this._map.on("click", (event) => {
      this._markerFeature.setGeometry(new Point(event.coordinate));
      this._emitCoordinates(event.coordinate);
    });

    const translate = new Translate({ features: new Collection([this._markerFeature]) });
    translate.on("translateend", (event) => {
      this._emitCoordinates(event.coordinate);
    });
    this._map.addInteraction(translate);
  }

  /** Reflects coordinates typed directly into the form fields onto the map. */
  private _syncFromInputs(latitude: number | null, longitude: number | null): void {
    if (!this._map || latitude === null || longitude === null) {
      return;
    }
    if (this._lastEmitted && this._isSameCoordinate(this._lastEmitted, { latitude, longitude })) {
      return;
    }

    const center = fromLonLat([longitude, latitude]);
    this._markerFeature.setGeometry(new Point(center));
    this._lastEmitted = { latitude, longitude };

    const view = this._map.getView();
    view.setCenter(center);
    view.setZoom(SELECTED_ZOOM);
  }

  private _isSameCoordinate(a: FacilityCoordinates, b: FacilityCoordinates): boolean {
    return (
      Math.abs(a.latitude - b.latitude) < COORDINATE_EPSILON &&
      Math.abs(a.longitude - b.longitude) < COORDINATE_EPSILON
    );
  }

  private _emitCoordinates(coordinate: Coordinate): void {
    const [longitude, latitude] = toLonLat(coordinate);
    this._lastEmitted = { latitude, longitude };
    this.coordinatesChange.emit({ latitude, longitude });
  }
}
