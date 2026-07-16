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

import { FACILITY_STATUS_COLORS } from "@core/constants/facility";
import type { Facility } from "@core/interfaces/facility";
import {
  FIT_PADDING,
  MARKER_ICON_ANCHOR,
  MARKER_ICON_SRC,
  MARKER_SCALE,
  MAX_FIT_ZOOM,
  SELECTED_MARKER_SCALE,
  SINGLE_MARKER_ZOOM
} from "@shared/constants/map";

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
  public readonly facilities = input.required<Facility[]>();
  public readonly selectedId = input<string | null>(null);
  public readonly markerClick = output<string>();
  protected readonly ariaLabel = computed(() => {
    const facilities = this.facilities();
    return facilities.length === 1
      ? `Map showing the location of ${facilities[0].name}`
      : `Map showing the location of ${facilities.length} facilities`;
  });
  private readonly _mapHost = viewChild.required<ElementRef<HTMLDivElement>>("mapHost");
  private readonly _vectorSource = new VectorSource();
  private _map?: Map;

  constructor() {
    effect(() => {
      this.facilities();
      this.selectedId();
      this._renderMarkers();
    });

    afterNextRender(() => {
      this._initializeMap(this._mapHost().nativeElement);
    });
  }

  /** Tears down the OpenLayers map instance. */
  public ngOnDestroy(): void {
    this._map?.setTarget();
    this._map = undefined;
  }

  private _initializeMap(target: HTMLDivElement): void {
    if (this._map) {
      return;
    }
    this._map = new Map({
      target,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: this._vectorSource })
      ],
      view: new View({ center: fromLonLat([0, 0]), zoom: 2 }),
      controls: []
    });
    this._map.on("click", (event) => {
      const feature = this._map?.forEachFeatureAtPixel(event.pixel, (found) => found);
      const facilityId = feature?.get("facilityId") as string | undefined;
      if (facilityId) {
        this.markerClick.emit(facilityId);
      }
    });
    this._renderMarkers();
  }

  private _renderMarkers(): void {
    if (!this._map) {
      return;
    }
    const facilities = this.facilities();
    this._vectorSource.clear();

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
      this._vectorSource.addFeature(feature);
    }

    this._fitView(facilities);
  }

  private _fitView(facilities: Facility[]): void {
    if (!this._map || facilities.length === 0) {
      return;
    }
    const view = this._map.getView();
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
