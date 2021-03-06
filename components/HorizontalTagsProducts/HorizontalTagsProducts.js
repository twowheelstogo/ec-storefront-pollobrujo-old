import React from "react";
import styled from "styled-components";
import ScrollSpyTabs from "./tags";
import { withComponents } from "@reactioncommerce/components-context";

const HorizontalTagsProducts = (props) => {
    const {
        tags,
        currencyCode,
        isLoadingCatalogItems,
        pageInfo,
        pageSize,
        setPageSize,
        setSortBy,
        components: {HorizontalProductCard},
        sortBy,
    } = props;

    const categoryProducts = (tags || []).map((items) => items);
 if (categoryProducts.length === 0) return (<h1>NO EXISTEN NINGUN PRODUCTO EN LA TIENDA</h1>);
 else
    return (
        <div
            style={{
                fontFamily: "roboto, sans-serif",
                fontSize: 15,
                backgroundColor: "#000000",
                color:"#FFFFFF"
            }}      
        >
            {     
                (categoryProducts.length > 0 && categoryProducts !== null) ? (
                    <ScrollSpyTabs
                        tabsInScroll={categoryProducts.map((e) => {
                                return {
                                    text:e.displayTitle,
                                    component: (
                                        <HorizontalProductCard 
                                            tags={e}
                                            currencyCode
                                            isLoadingCatalogItems
                                            pageInfo
                                            pageSize
                                            setPageSize
                                            setSortBy
                                            sortBy 
                                        />
                                    )
                                };
                        })}
                    />
                ) : (
                    <p>NO HAY CATEGORIAS</p>
                )            
            }
        </div>
    )
};

export default withComponents(HorizontalTagsProducts);