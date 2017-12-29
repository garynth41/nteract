/* eslint-disable max-len */
import React from "react";
import Immutable from "immutable";
import { Provider } from "react-redux";
import { shallow, mount } from "enzyme";

import renderer from "react-test-renderer";

import { displayOrder, transforms } from "@nteract/transforms";
import { Notebook, getLanguageMode } from "../../src/providers/notebook";

import { dummyStore, dummyCommutable } from "../../src/dummy";

const dummyCellStatuses = dummyCommutable
  .get("cellOrder")
  .reduce(
    (statuses, cellID) =>
      statuses.set(
        cellID,
        Immutable.fromJS({ outputHidden: false, inputHidden: false })
      ),
    new Immutable.Map()
  );

// Boilerplate test to make sure the testing setup is configured
describe("Notebook", () => {
  test("accepts an Immutable.List of cells", () => {
    const stickyCells = new Immutable.Set().add(
      dummyCommutable.getIn(["cellOrder", 0])
    );

    const component = shallow(
      <Notebook
        cellOrder={dummyCommutable.get("cellOrder")}
        cellMap={dummyCommutable.get("cellMap")}
        transient={new Immutable.Map({ cellMap: new Immutable.Map() })}
        cellPagers={new Immutable.Map()}
        cellStatuses={new Immutable.Map()}
        // Sticky the first cell of the notebook so that the sticky code gets
        // triggered.
        stickyCells={stickyCells}
      />
    );
    expect(component).not.toBeNull();
  });

  describe("getLanguageMode", () => {
    test("determines the right language from the notebook metadata", () => {
      const lang = getLanguageMode(dummyCommutable.get("metadata"));
      expect(lang).toBe("ipython");

      const lang2 = getLanguageMode(
        dummyCommutable
          .setIn(["metadata", "language_info", "codemirror_mode", "name"], "r")
          .get("metadata")
      );
      expect(lang2).toBe("r");
    });
  });

  describe("keyDown", () => {
    test("detects a cell execution keypress", () => {
      const focusedCell = dummyCommutable.getIn(["cellOrder", 1]);

      const context = { store: dummyStore() };

      context.store.dispatch = jest.fn();

      const component = shallow(
        <Notebook
          cellOrder={dummyCommutable.get("cellOrder")}
          cellMap={dummyCommutable.get("cellMap")}
          transient={new Immutable.Map({ cellMap: new Immutable.Map() })}
          cellPagers={new Immutable.Map()}
          cellStatuses={dummyCellStatuses}
          stickyCells={new Immutable.Set()}
          cellFocused={focusedCell}
        />,
        { context }
      );

      const inst = component.instance();

      const evt = new window.CustomEvent("keydown");
      evt.ctrlKey = true;
      evt.keyCode = 13;

      inst.keyDown(evt);

      expect(context.store.dispatch).toHaveBeenCalledWith({
        type: "EXECUTE_CELL",
        id: focusedCell,
        source: dummyCommutable.getIn(["cellMap", focusedCell, "source"])
      });
    });
    test("detects a focus to next cell keypress", () => {
      const focusedCell = dummyCommutable.getIn(["cellOrder", 1]);

      const context = { store: dummyStore() };

      context.store.dispatch = jest.fn();

      const component = shallow(
        <Notebook
          cellOrder={dummyCommutable.get("cellOrder")}
          cellMap={dummyCommutable.get("cellMap")}
          transient={new Immutable.Map({ cellMap: new Immutable.Map() })}
          cellPagers={new Immutable.Map()}
          cellStatuses={dummyCellStatuses}
          stickyCells={new Immutable.Set()}
          cellFocused={focusedCell}
        />,
        { context }
      );

      const inst = component.instance();

      const evt = new window.CustomEvent("keydown");
      evt.shiftKey = true;
      evt.keyCode = 13;

      inst.keyDown(evt);

      expect(context.store.dispatch).toHaveBeenCalledWith({
        type: "FOCUS_NEXT_CELL",
        id: focusedCell,
        createCellIfUndefined: true
      });
    });
    test("handles a focus to next cell keypress on a sticky cell", () => {
      const focusedCell = dummyCommutable.getIn(["cellOrder", 1]);

      const context = { store: dummyStore() };

      context.store.dispatch = jest.fn();

      const component = shallow(
        <Notebook
          cellOrder={dummyCommutable.get("cellOrder")}
          cellMap={dummyCommutable.get("cellMap")}
          transient={new Immutable.Map({ cellMap: new Immutable.Map() })}
          cellPagers={new Immutable.Map()}
          cellStatuses={dummyCellStatuses}
          stickyCells={new Immutable.Set([focusedCell])}
          cellFocused={focusedCell}
        />,
        { context }
      );

      const inst = component.instance();

      const evt = new window.CustomEvent("keydown");
      evt.shiftKey = true;
      evt.keyCode = 13;

      inst.keyDown(evt);

      expect(context.store.dispatch).not.toHaveBeenCalledWith({
        type: "FOCUS_NEXT_CELL",
        id: focusedCell,
        createCellIfUndefined: true
      });
    });
  });
});
