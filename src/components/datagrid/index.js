import {AgGridReact} from 'ag-grid-react'; // React Data Grid Component
import {AllEnterpriseModule, LicenseManager, ModuleRegistry, themeQuartz, colorSchemeDark} from "ag-grid-enterprise";
import React, {useMemo} from "react";

ModuleRegistry.registerModules([ AllEnterpriseModule ]);
LicenseManager.setLicenseKey(process.env.NEXT_PUBLIC_AG_GRID_LICENSE);


function Grid ( props, ref ) {
    const customTheme = useMemo(() => themeQuartz
        .withPart(colorSchemeDark)
        .withParams({
            headerHeight: 40,
            fontFamily: "inherit",
            headerFontSize: 14,
            oddRowBackgroundColor: "#242424"
        }), []);
    return (
        <AgGridReact
            {...props}
            ref={ref}
            theme={customTheme}
            loadThemeGoogleFonts
        />
    )
}

const DataGrid = React.forwardRef(Grid);
export default DataGrid;